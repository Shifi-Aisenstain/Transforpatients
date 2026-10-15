using Bl.Models;
using Bl.Services;
using Dal.Models;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class VolunteerFreeTimeController : ControllerBase
    {
        private VolunteerFreeTimeService vftService;

        public VolunteerFreeTimeController(VolunteerFreeTimeService vft)
        {
            vftService = vft;
        }

        [HttpGet]
        public ActionResult<List<Bl.Models.VolunteerTime>> GetVolunteerFreeTimes()
        {
            return vftService.GetAll();
        }

        [HttpPost]
        public ActionResult AddVolunteerFreeTime([FromBody] VolunteerTime vt)
        {
            vftService.Create(vt);
            return Ok(vt);
        }

        [HttpPut]
        public ActionResult UpdateVolunteerFreeTime( [FromBody] VolunteerTime updatedVft)
        {
            vftService.Update(updatedVft);
            return Ok(updatedVft);
        }
        [HttpDelete("{id}")]
        public ActionResult DeleteVolunteerFreeTime(int id)
        {
            vftService.Delete(id);
            return Ok();
        }
    }
}

