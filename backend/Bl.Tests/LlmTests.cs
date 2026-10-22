using System.Net;
using System.Text;
using System.Text.Json;
using Bl.Llm;
using Bl.Matching;

namespace Bl.Tests;

internal class FakeLlm : ILlmClient
{
    private readonly Func<string, string, string> answer;
    public FakeLlm(Func<string, string, string> answer, bool configured = true)
    {
        this.answer = answer;
        IsConfigured = configured;
    }

    public bool IsConfigured { get; }
    public int Calls { get; private set; }
    public string? LastUserPrompt { get; private set; }

    public Task<string> CompleteAsync(string systemPrompt, string userPrompt, bool jsonOutput = false, CancellationToken ct = default)
    {
        Calls++;
        LastUserPrompt = userPrompt;
        return Task.FromResult(answer(systemPrompt, userPrompt));
    }
}

public class OpenAiCompatibleLlmClientTests
{
    private class StubHandler : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }
        public string? RequestBody { get; private set; }
        public HttpStatusCode Status { get; init; } = HttpStatusCode.OK;
        public string Body { get; init; } = "";
        public Exception? Throw { get; init; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Request = request;
            RequestBody = request.Content == null ? null : await request.Content.ReadAsStringAsync(ct);
            if (Throw != null) throw Throw;
            return new HttpResponseMessage(Status) { Content = new StringContent(Body, Encoding.UTF8, "application/json") };
        }
    }

    private static OpenAiCompatibleLlmClient Client(HttpMessageHandler handler, string apiKey = "secret-key") =>
        new(new HttpClient(handler), new LlmOptions { ApiKey = apiKey, Model = "test-model", RetryDelayMs = 0, BaseUrl = "https://llm.example/v1/" });

    /// <summary>Answers with the given statuses one after the other and records the model of every request.</summary>
    private class SequenceHandler : HttpMessageHandler
    {
        private readonly Queue<HttpStatusCode> statuses;
        public List<string> Models { get; } = new();
        public SequenceHandler(params HttpStatusCode[] statuses) => this.statuses = new Queue<HttpStatusCode>(statuses);

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            using var body = JsonDocument.Parse(await request.Content!.ReadAsStringAsync(ct));
            Models.Add(body.RootElement.GetProperty("model").GetString()!);
            var status = statuses.Count > 1 ? statuses.Dequeue() : statuses.Peek();
            var content = status == HttpStatusCode.OK ? OkBody : "{\"error\":{\"message\":\"high demand\"}}";
            return new HttpResponseMessage(status) { Content = new StringContent(content, Encoding.UTF8, "application/json") };
        }
    }

    private const string OkBody = "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"שלום\"}}]}";

    [Fact]
    public async Task Sends_an_openai_compatible_request_and_returns_the_answer()
    {
        var handler = new StubHandler { Body = OkBody };

        var answer = await Client(handler).CompleteAsync("system text", "user text", jsonOutput: true);

        Assert.Equal("שלום", answer);
        Assert.Equal("https://llm.example/v1/chat/completions", handler.Request!.RequestUri!.ToString());
        Assert.Equal("Bearer secret-key", handler.Request.Headers.Authorization!.ToString());
        using var body = JsonDocument.Parse(handler.RequestBody!);
        Assert.Equal("test-model", body.RootElement.GetProperty("model").GetString());
        Assert.Equal("json_object", body.RootElement.GetProperty("response_format").GetProperty("type").GetString());
        Assert.Equal("user text", body.RootElement.GetProperty("messages")[1].GetProperty("content").GetString());
    }

    [Fact]
    public async Task Does_not_ask_for_json_unless_requested()
    {
        var handler = new StubHandler { Body = OkBody };
        await Client(handler).CompleteAsync("s", "u");
        Assert.DoesNotContain("response_format", handler.RequestBody);
    }

    [Fact]
    public async Task Without_an_api_key_it_is_not_configured_and_does_not_call_out()
    {
        var handler = new StubHandler { Body = OkBody };
        var client = Client(handler, apiKey: "");

        Assert.False(client.IsConfigured);
        await Assert.ThrowsAsync<LlmException>(() => client.CompleteAsync("s", "u"));
        Assert.Null(handler.Request);
    }

    [Fact]
    public async Task Failure_statuses_unreachable_service_and_bad_bodies_become_llm_exceptions()
    {
        await Assert.ThrowsAsync<LlmException>(() => Client(new StubHandler { Status = HttpStatusCode.TooManyRequests, Body = "{\"error\":\"quota\"}" }).CompleteAsync("s", "u"));
        await Assert.ThrowsAsync<LlmException>(() => Client(new StubHandler { Throw = new HttpRequestException("down") }).CompleteAsync("s", "u"));
        await Assert.ThrowsAsync<LlmException>(() => Client(new StubHandler { Body = "not json" }).CompleteAsync("s", "u"));
        await Assert.ThrowsAsync<LlmException>(() => Client(new StubHandler { Body = "{\"choices\":[]}" }).CompleteAsync("s", "u"));
    }

    [Fact]
    public async Task Retries_a_temporary_overload_and_then_succeeds()
    {
        var handler = new SequenceHandler(HttpStatusCode.ServiceUnavailable, HttpStatusCode.ServiceUnavailable, HttpStatusCode.OK);

        var answer = await Client(handler).CompleteAsync("s", "u");

        Assert.Equal("שלום", answer);
        Assert.Equal(new[] { "test-model", "test-model", "test-model" }, handler.Models);
    }

    [Fact]
    public async Task Switches_to_the_fallback_model_when_the_main_model_stays_overloaded()
    {
        var handler = new SequenceHandler(HttpStatusCode.ServiceUnavailable, HttpStatusCode.ServiceUnavailable, HttpStatusCode.ServiceUnavailable, HttpStatusCode.OK);
        var client = new OpenAiCompatibleLlmClient(new HttpClient(handler),
            new LlmOptions { ApiKey = "k", Model = "main", FallbackModels = { "backup" }, RetryDelayMs = 0 });

        var answer = await client.CompleteAsync("s", "u");

        Assert.Equal("שלום", answer);
        Assert.Equal(new[] { "main", "main", "main", "backup" }, handler.Models);
    }

    [Fact]
    public async Task Moves_to_the_next_model_at_once_when_a_model_is_rate_limited()
    {
        var handler = new SequenceHandler(HttpStatusCode.TooManyRequests, HttpStatusCode.OK);
        var client = new OpenAiCompatibleLlmClient(new HttpClient(handler),
            new LlmOptions { ApiKey = "k", Model = "limited", FallbackModels = { "other" }, RetryDelayMs = 0 });

        await client.CompleteAsync("s", "u");

        Assert.Equal(new[] { "limited", "other" }, handler.Models);
    }

    [Fact]
    public async Task Sends_the_reasoning_effort_only_when_it_is_configured()
    {
        var with = new StubHandler { Body = OkBody };
        await new OpenAiCompatibleLlmClient(new HttpClient(with), new LlmOptions { ApiKey = "k", ReasoningEffort = "low" }).CompleteAsync("s", "u");
        Assert.Contains("\"reasoning_effort\":\"low\"", with.RequestBody);

        var without = new StubHandler { Body = OkBody };
        await new OpenAiCompatibleLlmClient(new HttpClient(without), new LlmOptions { ApiKey = "k" }).CompleteAsync("s", "u");
        Assert.DoesNotContain("reasoning_effort", without.RequestBody);
    }

    private class SlowHandler : HttpMessageHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            await Task.Delay(TimeSpan.FromSeconds(30), ct);
            return new HttpResponseMessage(HttpStatusCode.OK);
        }
    }

    [Fact]
    public async Task Gives_up_after_the_total_timeout_instead_of_hanging()
    {
        var client = new OpenAiCompatibleLlmClient(new HttpClient(new SlowHandler()),
            new LlmOptions { ApiKey = "k", TotalTimeoutSeconds = 0.3, TimeoutSeconds = 60 });

        var started = DateTime.UtcNow;
        await Assert.ThrowsAsync<LlmException>(() => client.CompleteAsync("s", "u"));

        Assert.True(DateTime.UtcNow - started < TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task Skips_a_retired_model_without_retrying_it()
    {
        var handler = new SequenceHandler(HttpStatusCode.NotFound, HttpStatusCode.OK);
        var client = new OpenAiCompatibleLlmClient(new HttpClient(handler),
            new LlmOptions { ApiKey = "k", Model = "retired", FallbackModels = { "current" }, RetryDelayMs = 0 });

        var answer = await client.CompleteAsync("s", "u");

        Assert.Equal("שלום", answer);
        Assert.Equal(new[] { "retired", "current" }, handler.Models);
    }

    [Fact]
    public async Task Does_not_retry_errors_that_a_retry_cannot_fix()
    {
        var handler = new SequenceHandler(HttpStatusCode.Unauthorized);

        await Assert.ThrowsAsync<LlmException>(() => Client(handler).CompleteAsync("s", "u"));

        Assert.Single(handler.Models);
    }

    [Fact]
    public async Task Gives_up_after_all_attempts_with_a_transient_error()
    {
        var handler = new SequenceHandler(HttpStatusCode.ServiceUnavailable);

        var ex = await Assert.ThrowsAsync<LlmException>(() => Client(handler).CompleteAsync("s", "u"));

        Assert.True(ex.IsTransient);
        Assert.Equal(3, handler.Models.Count);
    }

    [Fact]
    public async Task The_api_key_is_not_leaked_into_error_messages()
    {
        var ex = await Assert.ThrowsAsync<LlmException>(() => Client(new StubHandler { Status = HttpStatusCode.Unauthorized, Body = "{\"error\":\"bad key\"}" }).CompleteAsync("s", "u"));
        Assert.DoesNotContain("secret-key", ex.Message);
    }
}

public class RideRequestParserTests
{
    private static readonly DateTime Now = new(2026, 10, 22, 14, 0, 0); // Thursday

    private static RideRequestParser Parser(string answer, out FakeLlm llm)
    {
        llm = new FakeLlm((_, _) => answer);
        return new RideRequestParser(llm);
    }

    [Fact]
    public async Task Extracts_all_fields_of_a_complete_request()
    {
        var parser = Parser("""
            {"familyLastName":"כהן","fromCity":"רמת גן","fromNeighborhood":"הראשונים","fromStreet":"ביאליק 5","destination":"שיבא",
             "startLocal":"2026-10-23T08:00","passengers":3,"needsBabySeat":true,"needsHandicapAccess":false,
             "recurring":true,"frequency":"weekly","occurrences":4}
            """, out var llm);

        var parsed = await parser.ParseAsync("משפחת כהן צריכה מחר ב-8 מרמת גן לשיבא", Now);

        Assert.Equal("כהן", parsed.FamilyLastName);
        Assert.Equal("רמת גן", parsed.FromCity);
        Assert.Equal("שיבא", parsed.Destination);
        Assert.Equal(new DateTime(2026, 10, 23, 8, 0, 0), parsed.Start);
        Assert.Equal(3, parsed.Passengers);
        Assert.True(parsed.NeedsBabySeat);
        Assert.False(parsed.NeedsHandicapAccess);
        Assert.True(parsed.IsRecurring);
        Assert.Equal("Weekly", parsed.Frequency);
        Assert.Equal(4, parsed.Occurrences);
        Assert.Empty(parsed.MissingFields);
        Assert.Empty(parsed.Warnings);
    }

    [Fact]
    public async Task Gives_the_llm_the_current_date_so_relative_dates_can_be_resolved()
    {
        var parser = Parser("{}", out var llm);

        await parser.ParseAsync("מחר בבוקר", Now);

        Assert.Contains("2026-10-22 14:00", llm.LastUserPrompt);
        Assert.Contains("חמישי", llm.LastUserPrompt);
        Assert.Contains("מחר בבוקר", llm.LastUserPrompt);
    }

    [Fact]
    public async Task Reports_what_is_missing_instead_of_guessing()
    {
        var parser = Parser("{\"fromCity\":\"חיפה\"}", out _);

        var parsed = await parser.ParseAsync("צריכים הסעה מחיפה", Now);

        Assert.Equal(new[] { "FamilyLastName", "Destination", "Start" }, parsed.MissingFields);
        Assert.Null(parsed.Start);
        Assert.Null(parsed.Passengers);
    }

    [Fact]
    public async Task Rejects_implausible_values_with_a_warning()
    {
        var parser = Parser("{\"familyLastName\":\"לוי\",\"fromCity\":\"חיפה\",\"destination\":\"רמב\\\"ם\",\"startLocal\":\"2026-10-01T08:00\",\"passengers\":99}", out _);

        var parsed = await parser.ParseAsync("הודעה", Now);

        Assert.Null(parsed.Start);              // in the past
        Assert.Null(parsed.Passengers);         // not plausible
        Assert.Equal(2, parsed.Warnings.Count);
        Assert.Contains("Start", parsed.MissingFields);
    }

    [Fact]
    public async Task Ignores_recurrence_details_when_the_request_is_not_recurring()
    {
        var parser = Parser("{\"recurring\":false,\"frequency\":\"Weekly\",\"occurrences\":5}", out _);

        var parsed = await parser.ParseAsync("הודעה", Now);

        Assert.False(parsed.IsRecurring);
        Assert.Null(parsed.Frequency);
        Assert.Null(parsed.Occurrences);
    }

    [Fact]
    public async Task Rejects_empty_or_oversized_text_before_calling_the_llm()
    {
        var parser = Parser("{}", out var llm);

        await Assert.ThrowsAsync<ArgumentException>(() => parser.ParseAsync("   ", Now));
        await Assert.ThrowsAsync<ArgumentException>(() => parser.ParseAsync(new string('א', RideRequestParser.MaxTextLength + 1), Now));
        Assert.Equal(0, llm.Calls);
    }

    [Fact]
    public async Task Fails_clearly_when_the_llm_is_not_configured_or_returns_garbage()
    {
        var notConfigured = new RideRequestParser(new FakeLlm((_, _) => "{}", configured: false));
        await Assert.ThrowsAsync<LlmException>(() => notConfigured.ParseAsync("הודעה", Now));

        await Assert.ThrowsAsync<LlmException>(() => Parser("sorry, I cannot help", out _).ParseAsync("הודעה", Now));
    }
}

public class MatchExplainerTests
{
    private static readonly DateTime Start = new(2026, 11, 3, 8, 0, 0);

    private static ExplainRequest Request() => new(
        new ExplainRide(Start, "רמת גן, ביאליק 12", "הדסה עין כרם, מחלקה אונקולוגית", 3),
        new List<ExplainCandidate>
        {
            new("דנה", 90, new() { "פנוי/ה בשעה זו (06:00-13:00)", "גר/ה ברמת גן (עיר המשפחה)" }, new()),
            new("יוסי", 40, new() { "פנוי/ה בשעה זו (07:00-12:00)" }, new() { "לא נוסע/ת לכיוון היעד" }),
        });

    [Fact]
    public async Task Uses_the_llm_text_when_the_answer_is_valid()
    {
        var llm = new FakeLlm((_, _) => "{\"summary\":\"דנה גרה קרוב.\",\"volunteerMessage\":\"שלום דנה\"}");

        var explanation = await new MatchExplainer(llm).ExplainAsync(Request());

        Assert.True(explanation.FromLlm);
        Assert.Equal("דנה גרה קרוב.", explanation.Summary);
        Assert.Equal("שלום דנה", explanation.VolunteerMessage);
    }

    [Fact]
    public async Task Accepts_json_wrapped_in_a_markdown_code_fence()
    {
        var llm = new FakeLlm((_, _) => "```json\n{\"summary\":\"הסבר\",\"volunteerMessage\":\"הודעה\"}\n```");

        Assert.True((await new MatchExplainer(llm).ExplainAsync(Request())).FromLlm);
    }

    [Theory]
    [InlineData("not json at all")]
    [InlineData("{\"summary\":\"only one field\"}")]
    [InlineData("[1,2,3]")]
    public async Task Falls_back_to_a_template_when_the_llm_answer_is_unusable(string badAnswer)
    {
        var explanation = await new MatchExplainer(new FakeLlm((_, _) => badAnswer)).ExplainAsync(Request());

        Assert.False(explanation.FromLlm);
        Assert.Contains("דנה", explanation.Summary);
        Assert.Contains("90%", explanation.Summary);
        Assert.Contains("יוסי", explanation.Summary);
        Assert.Contains("03/11", explanation.VolunteerMessage);
        Assert.Contains("מרמת גן", explanation.VolunteerMessage);
        Assert.Contains("להדסה עין כרם", explanation.VolunteerMessage);
    }

    [Fact]
    public async Task Falls_back_without_calling_the_llm_when_it_is_not_configured()
    {
        var llm = new FakeLlm((_, _) => "unused", configured: false);

        var explanation = await new MatchExplainer(llm).ExplainAsync(Request());

        Assert.False(explanation.FromLlm);
        Assert.Equal(0, llm.Calls);
    }

    [Fact]
    public async Task Rejects_a_request_without_a_ride_or_candidates()
    {
        var explainer = new MatchExplainer(new FakeLlm((_, _) => "{}"));

        await Assert.ThrowsAsync<ArgumentException>(() => explainer.ExplainAsync(new ExplainRequest(null, new() { new("דנה", 50, null, null) })));
        await Assert.ThrowsAsync<ArgumentException>(() => explainer.ExplainAsync(new ExplainRequest(Request().Ride, new())));
        await Assert.ThrowsAsync<ArgumentException>(() => explainer.ExplainAsync(new ExplainRequest(Request().Ride, null)));
    }

    [Fact]
    public async Task Sends_at_most_five_candidates_with_bounded_values()
    {
        var llm = new FakeLlm((_, _) => "{\"summary\":\"a\",\"volunteerMessage\":\"b\"}");
        var many = Enumerable.Range(1, 9).Select(i => new ExplainCandidate("מתנדב" + i, 500, new() { new string('א', 500) }, null)).ToList();

        await new MatchExplainer(llm).ExplainAsync(new ExplainRequest(Request().Ride, many));

        Assert.Contains("\"rank\": 5", llm.LastUserPrompt);
        Assert.DoesNotContain("\"rank\": 6", llm.LastUserPrompt);
        Assert.DoesNotContain("\"matchPercent\": 500", llm.LastUserPrompt);
        Assert.DoesNotContain(new string('א', 121), llm.LastUserPrompt);
    }

    [Fact]
    public void Facts_sent_to_the_llm_hold_only_the_city_and_hospital_names_not_streets_or_departments()
    {
        var request = Request();

        var facts = MatchExplainer.BuildFacts(request.Ride!, request.Candidates!);

        Assert.Contains("דנה", facts);
        Assert.Contains("\"from\": \"רמת גן\"", facts);
        Assert.Contains("\"to\": \"הדסה עין כרם\"", facts);
        Assert.DoesNotContain("ביאליק", facts);
        Assert.DoesNotContain("אונקולוגית", facts);
        Assert.DoesNotContain("phone", facts, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("רמת גן, ביאליק 12", "רמת גן")]
    [InlineData("  שיבא  ", "שיבא")]
    [InlineData("הדסה - מחלקה ג", "הדסה")]
    [InlineData("", null)]
    [InlineData(null, null)]
    public void Coarse_keeps_only_the_first_part_of_a_place(string? input, string? expected)
    {
        Assert.Equal(expected, MatchExplainer.Coarse(input));
    }
}
