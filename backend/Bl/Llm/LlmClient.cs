using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace Bl.Llm
{
    /// <summary>
    /// Settings of the LLM provider. Any service with an OpenAI-compatible "chat/completions" endpoint works:
    /// Gemini (default), OpenAI, or a local Ollama (BaseUrl http://localhost:11434/v1/, any ApiKey).
    /// The API key must come from user secrets or an environment variable, never from a committed file.
    /// </summary>
    public class LlmOptions
    {
        public string BaseUrl { get; set; } = "https://generativelanguage.googleapis.com/v1beta/openai/";
        public string ApiKey { get; set; } = "";
        public string Model { get; set; } = "gemini-3.8-flash";
        public int TimeoutSeconds { get; set; } = 30;

        /// <summary>Models tried in order when the main model is overloaded or no longer available. Set in appsettings.</summary>
        public List<string> FallbackModels { get; set; } = new();

        /// <summary>How many times a request to one model is tried before giving up on it.</summary>
        public int AttemptsPerModel { get; set; } = 3;

        public int RetryDelayMs { get; set; } = 1500;

        /// <summary>Upper limit for the whole call, including retries and fallback models. The caller then uses its template text.</summary>
        public double TotalTimeoutSeconds { get; set; } = 40;

        /// <summary>"none", "low", "medium" or "high" for models that think before answering. Low is enough for these simple tasks and much faster. Empty to omit.</summary>
        public string ReasoningEffort { get; set; } = "";
    }

    public interface ILlmClient
    {
        /// <summary>False when no API key is configured. Callers should then use their non-LLM fallback.</summary>
        bool IsConfigured { get; }

        Task<string> CompleteAsync(string systemPrompt, string userPrompt, bool jsonOutput = false, CancellationToken ct = default);
    }

    public class LlmException : Exception
    {
        public LlmException(string message, Exception? inner = null) : base(message, inner) { }

        /// <summary>True for temporary failures (overload, rate limit, network) that are worth retrying.</summary>
        public bool IsTransient { get; init; }

        /// <summary>True when this model should not be retried but another one may work: unknown or retired (404), or its quota is used up (429).</summary>
        public bool SkipToNextModel { get; init; }
    }

    public class OpenAiCompatibleLlmClient : ILlmClient
    {
        private readonly HttpClient http;
        private readonly LlmOptions options;

        public OpenAiCompatibleLlmClient(HttpClient http, LlmOptions options)
        {
            this.http = http;
            this.options = options;
            http.BaseAddress ??= new Uri(options.BaseUrl.TrimEnd('/') + "/");
            http.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
        }

        public bool IsConfigured => !string.IsNullOrWhiteSpace(options.ApiKey);

        public async Task<string> CompleteAsync(string systemPrompt, string userPrompt, bool jsonOutput = false, CancellationToken ct = default)
        {
            if (!IsConfigured)
                throw new LlmException("The LLM API key is not configured.");

            try
            {
                return await CompleteWithFallbacks(systemPrompt, userPrompt, jsonOutput, ct);
            }
            catch (OperationCanceledException) when (!ct.IsCancellationRequested)
            {
                throw TimedOut();
            }
        }

        private async Task<string> CompleteWithFallbacks(string systemPrompt, string userPrompt, bool jsonOutput, CancellationToken ct)
        {
            var models = new[] { options.Model }
                .Concat(options.FallbackModels)
                .Where(m => !string.IsNullOrWhiteSpace(m))
                .Distinct()
                .ToList();

            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(options.TotalTimeoutSeconds));
            using var linked = CancellationTokenSource.CreateLinkedTokenSource(ct, timeout.Token);
            ct = linked.Token;

            LlmException? last = null;
            foreach (var model in models)
            {
                for (var attempt = 1; attempt <= Math.Max(1, options.AttemptsPerModel); attempt++)
                {
                    try
                    {
                        return await SendOnce(model, systemPrompt, userPrompt, jsonOutput, ct);
                    }
                    catch (LlmException ex) when (ex.SkipToNextModel)
                    {
                        // this model is retired or out of quota for this key: go straight to the next one
                        last = ex;
                        break;
                    }
                    catch (LlmException ex) when (ex.IsTransient)
                    {
                        // overloaded, rate limited or unreachable: wait a little and try again, then try the next model
                        last = ex;
                        if (attempt < options.AttemptsPerModel && options.RetryDelayMs > 0)
                            await Task.Delay(options.RetryDelayMs * attempt, ct);
                    }
                }
            }
            throw last ?? new LlmException("The LLM request failed.");
        }

        private static LlmException TimedOut() => new("The LLM did not answer in time.") { IsTransient = false };

        private async Task<string> SendOnce(string model, string systemPrompt, string userPrompt, bool jsonOutput, CancellationToken ct)
        {
            var body = new Dictionary<string, object?>
            {
                ["model"] = model,
                ["temperature"] = 0.2,
                ["messages"] = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                }
            };
            if (jsonOutput)
                body["response_format"] = new { type = "json_object" };
            if (!string.IsNullOrWhiteSpace(options.ReasoningEffort))
                body["reasoning_effort"] = options.ReasoningEffort;

            using var request = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
            {
                Content = JsonContent.Create(body)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.ApiKey);

            string responseText;
            try
            {
                using var response = await http.SendAsync(request, ct);
                responseText = await response.Content.ReadAsStringAsync(ct);
                if (!response.IsSuccessStatusCode)
                {
                    var status = (int)response.StatusCode;
                    throw new LlmException($"The LLM request failed with status {status}: {Truncate(responseText)}")
                    {
                        IsTransient = status is 408 or 429 or 500 or 502 or 503 or 504,
                        SkipToNextModel = status is 404 or 429
                    };
                }
            }
            catch (HttpRequestException ex)
            {
                throw new LlmException("Could not reach the LLM service.", ex) { IsTransient = true };
            }
            catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
            {
                throw new LlmException("The LLM request timed out.", ex) { IsTransient = true };
            }

            try
            {
                using var doc = JsonDocument.Parse(responseText);
                var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                if (string.IsNullOrWhiteSpace(content))
                    throw new LlmException("The LLM returned an empty answer.");
                return content;
            }
            catch (Exception ex) when (ex is JsonException or KeyNotFoundException or InvalidOperationException or IndexOutOfRangeException)
            {
                throw new LlmException("The LLM answer has an unexpected format.", ex);
            }
        }

        private static string Truncate(string text) => text.Length <= 300 ? text : text[..300] + "...";
    }
}
