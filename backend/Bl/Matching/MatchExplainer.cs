using System.Text.Encodings.Web;
using System.Text.Json;
using Bl.Llm;

namespace Bl.Matching
{
    /// <summary>The ride, as the secretary sees it on the matching screen.</summary>
    public record ExplainRide(DateTime Start, string? Origin, string? Destination, int Passengers = 1);

    /// <summary>One ranked volunteer. The ranking and the reasons are computed by the app; the AI only phrases them.</summary>
    public record ExplainCandidate(string? FirstName, int Percent, List<string>? Pros, List<string>? Cons);

    public record ExplainRequest(ExplainRide? Ride, List<ExplainCandidate>? Candidates);

    /// <param name="Summary">Short explanation for the secretary, in Hebrew.</param>
    /// <param name="VolunteerMessage">A draft message to send to the top volunteer.</param>
    /// <param name="FromLlm">False when the text was built from a template (no AI key, or the AI service failed).</param>
    public record Explanation(string Summary, string VolunteerMessage, bool FromLlm);

    /// <summary>
    /// Turns the ranking that the matching screen already computed into text for the secretary: why the top volunteer fits
    /// and a draft message to send. The AI never chooses or re-ranks volunteers. It sees only first names, the reasons,
    /// the date and the city / hospital (the part of an address before the first comma), never phone numbers, family names,
    /// street addresses or medical departments. Without an AI the text is built from a template.
    /// </summary>
    public class MatchExplainer
    {
        public const int MaxCandidates = 5;
        private const int MaxTextLength = 120;

        private const string SystemPrompt =
            "אתה עוזר למזכירה בארגון שמסיע חולים בעזרת מתנדבים. המערכת כבר דירגה מתנדבים לנסיעה והמתנדב הראשון הוא המומלץ. " +
            "החזר אובייקט JSON עם שני שדות בלבד: " +
            "\"summary\" - הסבר קצר בעברית (עד 4 משפטים) מדוע המתנדב הראשון מתאים, הזכרת חסרון אם יש, וציון חלופה אם יש; " +
            "\"volunteerMessage\" - הודעת וואטסאפ קצרה ומנומסת בעברית למתנדב הראשון, שמציעה לו את הנסיעה " +
            "(תאריך, שעה, מוצא ויעד אם צוינו) ומבקשת תשובה. כתוב תאריכים בפורמט יום/חודש (למשל 23/10) ושעות כמו 08:00. " +
            "השתמש אך ורק בעובדות שמופיעות בנתונים. אל תמציא פרטים, אל תשנה את הדירוג, " +
            "ואל תזכיר שמות משפחה, מספרי טלפון, כתובות מדויקות או פרטים רפואיים.";

        private readonly ILlmClient llm;

        public MatchExplainer(ILlmClient llm)
        {
            this.llm = llm;
        }

        /// <exception cref="ArgumentException">The request has no ride or no candidates.</exception>
        public async Task<Explanation> ExplainAsync(ExplainRequest request, CancellationToken ct = default)
        {
            var (ride, candidates) = Normalize(request);

            if (!llm.IsConfigured)
                return Fallback(ride, candidates);

            try
            {
                var answer = await llm.CompleteAsync(SystemPrompt, BuildFacts(ride, candidates), jsonOutput: true, ct);
                var json = LlmJson.ParseObject(answer);
                var summary = LlmJson.GetString(json, "summary");
                var message = LlmJson.GetString(json, "volunteerMessage");
                if (summary == null || message == null)
                    throw new LlmException("The LLM answer is missing a required field.");
                return new Explanation(summary, message, true);
            }
            catch (LlmException)
            {
                return Fallback(ride, candidates);
            }
        }

        /// <summary>The facts sent to the AI. Public so the privacy rules can be tested.</summary>
        public static string BuildFacts(ExplainRide ride, IReadOnlyList<ExplainCandidate> candidates)
        {
            var facts = new
            {
                ride = new
                {
                    date = ride.Start.ToString("yyyy-MM-dd"),
                    time = ride.Start.ToString("HH:mm"),
                    from = Coarse(ride.Origin),
                    to = Coarse(ride.Destination),
                    passengers = ride.Passengers
                },
                candidates = candidates.Select((c, index) => new
                {
                    rank = index + 1,
                    firstName = c.FirstName,
                    matchPercent = c.Percent,
                    pros = c.Pros,
                    cons = c.Cons
                })
            };
            return JsonSerializer.Serialize(facts, new JsonSerializerOptions { WriteIndented = true, Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping });
        }

        /// <summary>Only the first part of a free-text place: "רמת גן, ביאליק 12" becomes "רמת גן"; "הדסה, מחלקה אונקולוגית" becomes "הדסה".</summary>
        public static string? Coarse(string? place)
        {
            if (string.IsNullOrWhiteSpace(place)) return null;
            var first = place.Split(',', '-', '–')[0].Trim();
            return Clip(first, 60);
        }

        private static (ExplainRide Ride, List<ExplainCandidate> Candidates) Normalize(ExplainRequest request)
        {
            if (request?.Ride == null)
                throw new ArgumentException("The ride is missing.", nameof(request));
            if (request.Candidates == null || request.Candidates.Count == 0)
                throw new ArgumentException("At least one candidate is required.", nameof(request));

            var candidates = request.Candidates.Take(MaxCandidates).Select(c => new ExplainCandidate(
                Clip(string.IsNullOrWhiteSpace(c.FirstName) ? "מתנדב" : c.FirstName.Trim(), 40),
                Math.Clamp(c.Percent, 0, 100),
                Clean(c.Pros),
                Clean(c.Cons))).ToList();

            var passengers = Math.Clamp(request.Ride.Passengers, 1, 20);
            return (request.Ride with { Passengers = passengers }, candidates);
        }

        private static List<string> Clean(IEnumerable<string>? items) =>
            (items ?? Enumerable.Empty<string>()).Where(s => !string.IsNullOrWhiteSpace(s)).Take(8).Select(s => Clip(s.Trim(), MaxTextLength)).ToList();

        private static string Clip(string text, int max) => text.Length <= max ? text : text[..max];

        private static Explanation Fallback(ExplainRide ride, IReadOnlyList<ExplainCandidate> candidates)
        {
            var best = candidates[0];
            var summary = best.Pros is { Count: > 0 }
                ? $"המתנדב המומלץ הוא {best.FirstName} ({best.Percent}% התאמה): {string.Join(", ", best.Pros)}."
                : $"{best.FirstName} הוא הראשון בדירוג ({best.Percent}% התאמה).";
            if (best.Cons is { Count: > 0 })
                summary += $" שימי לב: {string.Join(", ", best.Cons)}.";
            if (candidates.Count > 1)
                summary += $" חלופה: {candidates[1].FirstName}.";

            var from = Coarse(ride.Origin);
            var to = Coarse(ride.Destination);
            var route = (from != null ? $" מ{from}" : "") + (to != null ? $" ל{to}" : "");
            var message = $"שלום {best.FirstName}, יש נסיעה{route} ב-{ride.Start:dd/MM} בשעה {ride.Start:HH:mm}. האם תוכל/י לקחת אותה? תודה!";
            return new Explanation(summary, message, false);
        }
    }
}
