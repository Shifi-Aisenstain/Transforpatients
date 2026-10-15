using Dal.Api;
using Dal.Models;
using Microsoft.EntityFrameworkCore;

namespace Dal.Services
{
    public class VolunteerService : IVolunteer
    {
        DataManager db;

        public VolunteerService(DataManager db)
        {
            this.db = db;
        }

        public bool Create(Volunteer volunteer)
        {
            try
            {
                if (volunteer == null)
                {
                    throw new ArgumentNullException();
                }
                if (db.Volunteers.Find(volunteer.Id) != null)
                {
                    throw new ArgumentException("volunteer exists");
                }
                db.Volunteers.Add(volunteer);
                db.SaveChanges();
                return true;
            }
            catch { return false; }
        }

        public List<Volunteer> GetAll()
        {
            return db.Volunteers.Include(v => v.Address).ToList();
        }

        public bool Update(Volunteer volunteer, string oldPhoneNumber)
        {
            if (volunteer == null)
            {
                throw new ArgumentNullException();
            }
            var VolunteerToUpdate = db.Volunteers.Include(f => f.Address).FirstOrDefault(f => f.PhoneNumber == oldPhoneNumber);
            if (VolunteerToUpdate == null)
            {
                throw new ArgumentException("Volunteer does not exist");
            }
            VolunteerToUpdate.FirstName = volunteer.FirstName;
            VolunteerToUpdate.LastName = volunteer.LastName;
            VolunteerToUpdate.PhoneNumber = volunteer.PhoneNumber;
            VolunteerToUpdate.Email = volunteer.Email;
            VolunteerToUpdate.AddressId = volunteer.AddressId;
            VolunteerToUpdate.IsCarHandicapped = volunteer.IsCarHandicapped;
            VolunteerToUpdate.AvailableSeats = volunteer.AvailableSeats;
            VolunteerToUpdate.IsBabySeat = volunteer.IsBabySeat;
            VolunteerToUpdate.IsActive = volunteer.IsActive;
            VolunteerToUpdate.Address = db.Addresses.Find(volunteer.AddressId);
            db.SaveChanges();
            return true;
        }
    }
}



