using Bl.Models;
using Bl.Services;
using Dal.Models;
using Dal.Services;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class FamiliesController:ControllerBase
    {
        private FamilyService familyService;

        public FamiliesController(FamilyService fs)
        {
            familyService = fs;
        }

        [HttpGet]
        public ActionResult<List<Bl.Models.Family>> GetFamilies()
        {
            return familyService.GetAll();
        }

        [HttpPost]
        public ActionResult AddFamily([FromBody] FullFamily family)
        {
            familyService.Create(family);
            return Ok();
        }

        [HttpPut("{oldPhoneNumber}")]
        public ActionResult UpdateFamily([FromBody] FullFamily updatedFamily, string oldPhoneNumber)
        {
            familyService.Update(updatedFamily, oldPhoneNumber);
            return Ok();
        }
    }
}
