using Bl.Api;
using Bl.Models;
using Dal.Models;
using Dal.Services;

namespace Bl.Services
{
    public class VolunteerService : IVolunteer
    {
        Dal.Services.VolunteerService db;
        public VolunteerService(Dal.Services.VolunteerService db)
        {
            this.db = db;
        }
        public bool Create(Bl.Models.Volunteer volunteer)
        {
            if (volunteer == null)
            {
                throw new ArgumentNullException("Volunteer is null");
            }
            if (db.GetAll().Find(v => v.Id == volunteer.Id) != null)
            {
                throw new ArgumentException("Volunteer already exists");
            }
            var dalVolunteer = new Dal.Models.Volunteer
            {
                Id = volunteer.Id,
                LastName = volunteer.LastName,
                FirstName = volunteer.FirstName,
                PhoneNumber = volunteer.PhoneNumber,
                Email = volunteer.Email,
                AddressId = volunteer.AddressId,
                IsCarHandicapped = volunteer.IsCarHandicapped,
                AvailableSeats = volunteer.AvailableSeats,
                IsBabySeat = volunteer.IsBabySeat,
                IsActive = volunteer.IsActive,
                Address = volunteer.Address == null ? null : new Dal.Models.Address
                {
                    City = volunteer.Address.City,
                    Neighborhood = volunteer.Address.Neighborhood,
                    Street = volunteer.Address.Street,
                    HouseNumber = volunteer.Address.HouseNumber
                },
                RideRequests = volunteer.RideRequests,
                VolunteersFreeTimes = volunteer.VolunteersFreeTimes
            };
            return db.Create(dalVolunteer);
        }

        public List<Bl.Models.Volunteer> GetAll()
        {
            List<Bl.Models.Volunteer> list = new List<Bl.Models.Volunteer>();
            db.GetAll().ForEach(v => list.Add(new Bl.Models.Volunteer()
            {
                Id = v.Id,
                LastName = v.LastName,
                FirstName = v.FirstName,
                PhoneNumber = v.PhoneNumber,
                Email = v.Email,
                AddressId = v.AddressId,
                IsCarHandicapped = v.IsCarHandicapped,
                AvailableSeats = v.AvailableSeats,
                IsBabySeat = v.IsBabySeat,
                IsActive = v.IsActive,
                Address = v.Address != null ? new Bl.Models.AddressForScreen
                {
                    City = v.Address.City,
                    Neighborhood = v.Address.Neighborhood,
                    Street = v.Address.Street,
                    HouseNumber = v.Address.HouseNumber
                } : null,
                RideRequests = v.RideRequests,
                VolunteersFreeTimes = v.VolunteersFreeTimes
            }));
            return list;
        }
        public bool Update(Bl.Models.Volunteer volunteer, string oldPhoneNumber)
        {
            var dalVolunteer = new Dal.Models.Volunteer
            {
                Id = volunteer.Id,
                LastName = volunteer.LastName,
                FirstName = volunteer.FirstName,
                PhoneNumber = volunteer.PhoneNumber,
                Email = volunteer.Email,
                AddressId = volunteer.AddressId,
                IsCarHandicapped = volunteer.IsCarHandicapped,
                AvailableSeats = volunteer.AvailableSeats,
                IsBabySeat = volunteer.IsBabySeat,
                IsActive = volunteer.IsActive
            };
            return db.Update(dalVolunteer, oldPhoneNumber);
        }

        bool ICrud<IVolunteer>.Create(IVolunteer entity)
        {
            throw new NotImplementedException();
        }

        List<IVolunteer> ICrud<IVolunteer>.GetAll()
        {
            throw new NotImplementedException();
        }
    }
}