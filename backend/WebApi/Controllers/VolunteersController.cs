using Bl.Models;
using Bl.Services;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VolunteersController : ControllerBase
    {
        private VolunteerService volunteersService;

        public VolunteersController(VolunteerService vs)
        {
            volunteersService = vs;
        }

        [HttpGet]
        public ActionResult<List<Volunteer>> GetVolunteers()
        {
            return volunteersService.GetAll();
        }

        [HttpPost]
        public ActionResult AddVolunteer([FromBody] Volunteer volunteer)
        {
            volunteersService.Create(volunteer);
            return Ok();
        }

        [HttpPut("{oldPhoneNumber}")]
        public ActionResult UpdateVolunteer([FromBody] Volunteer volunteer, string oldPhoneNumber)
        {
            volunteersService.Update(volunteer, oldPhoneNumber);
            return Ok();
        }

    }
}