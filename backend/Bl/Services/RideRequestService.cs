using Bl.Api;
using Bl.Models;
using Dal.Models;
using Dal.Services;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Bl.Services
{
    public class RideRequestService : IRideRequest
    {
        Dal.Services.RideRequestService db;
        Dal.Services.VolunteersFreeTimesService vftDb;

        public RideRequestService(Dal.Services.RideRequestService db, Dal.Services.VolunteersFreeTimesService vftDb)
        {
            this.db = db;
            this.vftDb = vftDb;
        }
        public List<Bl.Models.VolunteerTime> VolunteerArrangementsForFamily(RideRequest familyRequest)
        {
            if (familyRequest == null) throw new ArgumentNullException(nameof(familyRequest));

            var allTimes = vftDb.GetAll();
            if (allTimes == null)
            {
                Debug.WriteLine("No volunteer free times available.");
                return new List<Bl.Models.VolunteerTime>();
            }
            var list = allTimes
                .Where(f => f.StartDateTime.Date == familyRequest.RideTime.Date)
                .Select(f => new Bl.Models.VolunteerTime
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
                })
                .ToList();
            return list;
        }


        public List<Bl.Models.RideRequests> GetAll()
        {
            var allRequests = db.GetAll();
            if (allRequests == null)
            {
                throw new Exception("No ride requests found in the database.");
            }

            var list = allRequests.Select(f => new Bl.Models.RideRequests()
            {
                Id = f.Id,
                FamilyId = f.FamilyId,
                VolunteerId = f.VolunteerId,
                RideTime = f.RideTime,
                Status = f.Status,
                RegularRide = f.RegularRide,
                Origin = f.Origin,
                Destination = f.Destination,
                FrequencyRegularRideId = f.FrequencyRegularRideId,
                FrequencyRegularRide = f.FrequencyRegularRide,
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
                } : null,
                Family = f.Family != null ? new Bl.Models.Family()
                {
                    Id = f.Family.Id ?? 0,
                    LastName = f.Family.LastName,
                    PhoneNumber = f.Family.PhoneNumber
                } : new Bl.Models.Family()
                {
                    LastName = "לא ידוע",
                    PhoneNumber = ""
                }
            }).ToList();

            return list;
        }

        public List<RideRequests> GetById(int VolunteerId)
        {
            var allRequests = db.GetAll();

            var list = allRequests
                .Where(f => f.VolunteerId == VolunteerId && f.Status == 3)
                .Select(f => new Bl.Models.RideRequests()
                {
                    FamilyId = f.FamilyId,
                    VolunteerId = f.VolunteerId,
                    RideTime = f.RideTime,
                    Status = f.Status,
                    RegularRide = f.RegularRide,
                    Origin = f.Origin,
                    Destination = f.Destination,
                    FrequencyRegularRideId = f.FrequencyRegularRideId,
                    FrequencyRegularRide = f.FrequencyRegularRide,
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
                }).ToList();

            return list;
        }


        public bool Create(RideRequests entity)
        {
            return Create(entity, null, 1);
        }

        public bool Create(RideRequests entity, FrequencyType? frequencyType, int times)
        {
            var baseDate = entity.RideTime;

            for (int i = 0; i < times; i++)
            {
                var rideTime = frequencyType switch
                {
                    FrequencyType.Weekly => baseDate.AddDays(7 * i),
                    FrequencyType.Monthly => baseDate.AddMonths(i),
                    _ => baseDate
                };

                var dalRideRequest = new Dal.Models.RideRequest
                {
                    FamilyId = entity.FamilyId,
                    VolunteerId = entity.VolunteerId,
                    RideTime = rideTime,
                    Status = 1,
                    RegularRide = frequencyType != null,
                    Origin = entity.Origin,
                    Destination = entity.Destination,
                    FrequencyRegularRideId = entity.FrequencyRegularRideId
                };
                db.Create(dalRideRequest);
            }
            return true;
        }


        public bool Update(Bl.Models.RideRequests rideRequest)
        {
            if (rideRequest == null)
            {
                throw new ArgumentNullException();
            }

            //if (db.GetAll.Find(rideRequest.Id) == null)
            //{
            //    throw new ArgumentException("rideRequest does not exist");
            //}


            var dalRideRequest = new Dal.Models.RideRequest
            {
                Id = rideRequest.Id,
                FamilyId = rideRequest.FamilyId,
                VolunteerId = rideRequest.VolunteerId,
                RideTime = rideRequest.RideTime,
                Status = rideRequest.Status,
                RegularRide = rideRequest.RegularRide,
                Origin = rideRequest.Origin,
                Destination = rideRequest.Destination,
                FrequencyRegularRideId = rideRequest.FrequencyRegularRideId
            };
            db.Update(dalRideRequest);
            return true;
        }
        public bool Delete(int id)
        {
            db.delete(id);
            return true;
        }
    }
}
