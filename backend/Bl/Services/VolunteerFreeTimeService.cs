using Bl.Api;
using Bl.Models;
using Dal.Api;
using Dal.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Bl.Services
{
    public class VolunteerFreeTimeService : Bl.Api.IVolunteerFreeTime
    {
        Dal.Services.VolunteersFreeTimesService db;
        public VolunteerFreeTimeService(Dal.Services.VolunteersFreeTimesService db)
        {
            this.db = db;
        }
        public bool Create(VolunteerTime volunteerFreeTime)
        {
            if (volunteerFreeTime == null)
            {
                throw new ArgumentNullException("volunteer free time is null");
            }
            var dalvft = new Dal.Models.VolunteersFreeTime
            {
                Id = volunteerFreeTime.Id,
                VolunteerId = volunteerFreeTime.VolunteerId,
                //Volunteer = volunteerFreeTime.Volunteer,
                StartDateTime = volunteerFreeTime.StartDateTime,
                EndDateTime = volunteerFreeTime.EndDateTime
            };
            return db.Create(dalvft);
        }


        public List<VolunteerTime> GetAll()
        {
            List<Bl.Models.VolunteerTime> list = new List<Bl.Models.VolunteerTime>();
            db.GetAll().ForEach(f => list.Add(new Bl.Models.VolunteerTime()
            {
                Id = f.Id,
                VolunteerId = f.VolunteerId,
                StartDateTime = f.StartDateTime,
                EndDateTime = f.EndDateTime,
                Volunteer = f.Volunteer != null ? new Bl.Models.Volunteer
                {
                    Id = f.Volunteer.Id,
                    FirstName = f.Volunteer.FirstName,
                    LastName = f.Volunteer.LastName,
                    PhoneNumber = f.Volunteer.PhoneNumber,
                    Email = f.Volunteer.Email,
                    AddressId = f.Volunteer.AddressId,
                    IsCarHandicapped = f.Volunteer.IsCarHandicapped,
                    AvailableSeats = f.Volunteer.AvailableSeats,
                    IsBabySeat = f.Volunteer.IsBabySeat,
                    IsActive = f.Volunteer.IsActive
                } : null
            }));
            return list;
        }
        public bool Update(VolunteerTime vt)
        {
            var dalvft = new Dal.Models.VolunteersFreeTime
            {
                Id = vt.Id,
                VolunteerId = vt.VolunteerId,
                //Volunteer = vt.Volunteer,
                StartDateTime = vt.StartDateTime,
                EndDateTime = vt.EndDateTime
            };
            return db.Update(dalvft);
        }
    public bool Delete(int id)
        {
            return db.Delete(id);
        }   
    }
}



