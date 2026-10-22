using System.Text.Json;

namespace Bl.Llm
{
    /// <summary>Helpers for reading the JSON an LLM returns. Models sometimes wrap JSON in a markdown code fence.</summary>
    internal static class LlmJson
    {
        public static JsonElement ParseObject(string raw)
        {
            var text = raw.Trim();
            if (text.StartsWith("```"))
            {
                var firstNewLine = text.IndexOf('\n');
                text = firstNewLine >= 0 ? text[(firstNewLine + 1)..] : text.Trim('`');
                var lastFence = text.LastIndexOf("```", StringComparison.Ordinal);
                if (lastFence >= 0) text = text[..lastFence];
                text = text.Trim();
            }

            try
            {
                var element = JsonDocument.Parse(text).RootElement.Clone();
                if (element.ValueKind != JsonValueKind.Object)
                    throw new LlmException("The LLM answer is not a JSON object.");
                return element;
            }
            catch (JsonException ex)
            {
                throw new LlmException("The LLM answer is not valid JSON.", ex);
            }
        }

        public static string? GetString(JsonElement obj, string name)
        {
            if (!obj.TryGetProperty(name, out var value) || value.ValueKind != JsonValueKind.String) return null;
            var text = value.GetString()?.Trim();
            return string.IsNullOrEmpty(text) ? null : text;
        }

        public static int? GetInt(JsonElement obj, string name)
        {
            if (!obj.TryGetProperty(name, out var value)) return null;
            if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var number)) return number;
            if (value.ValueKind == JsonValueKind.String && int.TryParse(value.GetString(), out var parsed)) return parsed;
            return null;
        }

        public static bool GetBool(JsonElement obj, string name) =>
            obj.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.True;
    }
}
