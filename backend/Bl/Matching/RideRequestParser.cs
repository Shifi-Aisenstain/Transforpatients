using System.Globalization;
using Bl.Llm;

namespace Bl.Matching
{
    /// <summary>
    /// A ride request extracted from free text. Anything the text does not say is null: the parser never guesses.
    /// The secretary reviews and completes it before it is saved.
    /// </summary>
    public record ParsedRideRequest(
        string? FamilyLastName,
        string? FromCity,
        string? FromNeighborhood,
        string? FromStreet,
        string? Destination,
        DateTime? Start,
        int? Passengers,
        bool NeedsBabySeat,
        bool NeedsHandicapAccess,
        bool IsRecurring,
        string? Frequency,
        int? Occurrences,
        IReadOnlyList<string> MissingFields,
        IReadOnlyList<string> Warnings);

    /// <summary>Turns a free-text message (for example from WhatsApp) into the fields of a ride request.</summary>
    public class RideRequestParser
    {
        public const int MaxTextLength = 2000;

        private const string SystemPrompt =
            "אתה מחלץ פרטי בקשת הסעה לחולים מהודעה בעברית. החזר אובייקט JSON בלבד עם השדות: " +
            "familyLastName (שם משפחה), fromCity (עיר מוצא), fromNeighborhood (שכונה), fromStreet (רחוב ומספר), " +
            "destination (יעד, למשל שם בית חולים), startLocal (תאריך ושעה בפורמט yyyy-MM-ddTHH:mm לפי שעון ישראל), " +
            "passengers (מספר נוסעים כמספר שלם), needsBabySeat (true/false), needsHandicapAccess (true אם נדרש רכב נגיש לכיסא גלגלים), " +
            "recurring (true אם הנסיעה חוזרת), frequency (\"Weekly\" או \"Monthly\" או null), occurrences (כמה פעמים, או null). " +
            "כלל חשוב: מה שלא כתוב במפורש בהודעה - החזר null, ואל תנחש. פענח תאריכים יחסיים (מחר, ביום ראשון) לפי התאריך הנוכחי שנמסר. " +
            "false מותר רק כשההודעה מראה שלא צריך. אל תוסיף שדות אחרים.";

        private readonly ILlmClient llm;

        public RideRequestParser(ILlmClient llm)
        {
            this.llm = llm;
        }

        public async Task<ParsedRideRequest> ParseAsync(string text, DateTime now, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(text))
                throw new ArgumentException("The text of the request is empty.", nameof(text));
            if (text.Length > MaxTextLength)
                throw new ArgumentException($"The text is longer than {MaxTextLength} characters.", nameof(text));
            if (!llm.IsConfigured)
                throw new LlmException("The LLM API key is not configured.");

            var userPrompt = $"התאריך והשעה עכשיו (שעון ישראל): {now:yyyy-MM-dd HH:mm}, יום {HebrewDay(now.DayOfWeek)}.\n\nההודעה:\n{text}";
            var answer = await llm.CompleteAsync(SystemPrompt, userPrompt, jsonOutput: true, ct);
            var json = LlmJson.ParseObject(answer);

            var warnings = new List<string>();

            DateTime? start = null;
            var startText = LlmJson.GetString(json, "startLocal");
            if (startText != null)
            {
                if (DateTime.TryParse(startText, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
                {
                    if (parsed < now)
                        warnings.Add("התאריך שזוהה כבר עבר - נא לבדוק.");
                    else
                        start = parsed;
                }
                else
                {
                    warnings.Add("לא הצלחנו להבין את התאריך והשעה.");
                }
            }

            var passengers = LlmJson.GetInt(json, "passengers");
            if (passengers is < 1 or > 20)
            {
                warnings.Add("מספר הנוסעים שזוהה אינו סביר - נא לבדוק.");
                passengers = null;
            }

            var recurring = LlmJson.GetBool(json, "recurring");
            var frequency = recurring ? NormalizeFrequency(LlmJson.GetString(json, "frequency")) : null;
            var occurrences = recurring ? LlmJson.GetInt(json, "occurrences") : null;
            if (occurrences is < 1 or > 52) occurrences = null;

            var familyLastName = LlmJson.GetString(json, "familyLastName");
            var fromCity = LlmJson.GetString(json, "fromCity");
            var destination = LlmJson.GetString(json, "destination");

            var missing = new List<string>();
            if (familyLastName == null) missing.Add(nameof(ParsedRideRequest.FamilyLastName));
            if (fromCity == null) missing.Add(nameof(ParsedRideRequest.FromCity));
            if (destination == null) missing.Add(nameof(ParsedRideRequest.Destination));
            if (start == null) missing.Add(nameof(ParsedRideRequest.Start));

            return new ParsedRideRequest(
                familyLastName,
                fromCity,
                LlmJson.GetString(json, "fromNeighborhood"),
                LlmJson.GetString(json, "fromStreet"),
                destination,
                start,
                passengers,
                LlmJson.GetBool(json, "needsBabySeat"),
                LlmJson.GetBool(json, "needsHandicapAccess"),
                recurring,
                frequency,
                occurrences,
                missing,
                warnings);
        }

        private static string? NormalizeFrequency(string? value) => value?.ToLowerInvariant() switch
        {
            "weekly" => "Weekly",
            "monthly" => "Monthly",
            _ => null
        };

        private static string HebrewDay(DayOfWeek day) => day switch
        {
            DayOfWeek.Sunday => "ראשון",
            DayOfWeek.Monday => "שני",
            DayOfWeek.Tuesday => "שלישי",
            DayOfWeek.Wednesday => "רביעי",
            DayOfWeek.Thursday => "חמישי",
            DayOfWeek.Friday => "שישי",
            _ => "שבת"
        };
    }
}
