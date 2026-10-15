using Bl.Models;
using Bl.Services;
using Dal.Models;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RidesController : ControllerBase
    {
        private readonly RideRequestService RideService;
        private readonly DataManager DB;

        public RidesController(RideRequestService rideService, DataManager db)
        {
            RideService = rideService;
            DB = db;
        }

        [HttpGet]
        public ActionResult<List<RideRequests>> GetAll()
        {
            return RideService.GetAll();
        }

        [HttpGet("volunteer/{volunteerId}")]
        public ActionResult<List<RideRequests>> GetByVolunteer(int volunteerId)
        {
            var list = RideService.GetById(volunteerId);
            if (list == null || list.Count == 0)
            {
                return NotFound();
            }
            return list;
        }

        [HttpPost]
        public ActionResult AddRides([FromBody] Bl.Models.RideRequests rideRequest,[FromQuery] FrequencyType? ft,[FromQuery] int times=1)
        {
            RideService.Create(rideRequest, ft, times);
            return Ok(rideRequest);
        }

        [HttpPut]
        public ActionResult UpdateRide([FromBody] Bl.Models.RideRequests updatedRideRequests)
        {
            RideService.Update(updatedRideRequests);
            return Ok(updatedRideRequests);
        }

        [HttpDelete("{id}")]
        public ActionResult Delete(int id)
        {
            var ride = DB.RideRequests.Find(id);
            if (ride == null)
            {
                return NotFound();
            }

            DB.RideRequests.Remove(ride);
            DB.SaveChanges();

            return NoContent();
        }
    }
}