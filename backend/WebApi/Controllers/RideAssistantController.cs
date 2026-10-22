using Bl.Llm;
using Bl.Matching;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    public record ParseRequestBody(string? Text);

    /// <summary>The AI-assisted features: request intake from free text, and an explanation of the best volunteer match.</summary>
    [ApiController]
    [Route("api/rides")]
    public class RideAssistantController : ControllerBase
    {
        private readonly RideRequestParser parser;
        private readonly MatchExplainer explainer;

        public RideAssistantController(RideRequestParser parser, MatchExplainer explainer)
        {
            this.parser = parser;
            this.explainer = explainer;
        }

        /// <summary>Extracts the fields of a ride request from a free-text message. The coordinator reviews the result.</summary>
        [HttpPost("parse-request")]
        public async Task<ActionResult<ParsedRideRequest>> ParseRequest([FromBody] ParseRequestBody body, CancellationToken ct)
        {
            try
            {
                return await parser.ParseAsync(body.Text ?? "", DateTime.Now, ct);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (LlmException ex)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
            }
        }

        /// <summary>Explains the ranking computed on the matching screen and drafts a message to the top volunteer.</summary>
        [HttpPost("explain-match")]
        public async Task<ActionResult<Explanation>> ExplainMatch([FromBody] ExplainRequest request, CancellationToken ct)
        {
            try
            {
                return await explainer.ExplainAsync(request, ct);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
