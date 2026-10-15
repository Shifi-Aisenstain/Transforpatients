using Dal.Api;
using Dal.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dal.Services
{
    public class RideRequestService : IRideRequest
    {
        DataManager db;
        public RideRequestService(DataManager db)
        {
            this.db = db;
        }

        public bool Create(RideRequest rideRequest)
        {
            if (rideRequest == null)
            {
                throw new ArgumentNullException();
            }
            if (db.RideRequests.Find(rideRequest.Id) != null)
            {
                throw new ArgumentException("rideRequest already exists");
            }
            db.RideRequests.Add(rideRequest);
            db.SaveChanges();
            return true;
        }

        public List<RideRequest> GetAll()
        {
            return db.RideRequests
                     .Include(a => a.Family)
                     .Include(a => a.Volunteer)
                     .Include(a => a.FrequencyRegularRide)
                     .ToList();
        }

        public bool Update(RideRequest rideRequest)
        {
            if (rideRequest == null)
            {
                throw new ArgumentNullException();
            }

            if (db.RideRequests.Find(rideRequest.Id) == null)
            {
                throw new ArgumentException("rideRequest does not exist");
            }

            var oldRideRequest = db.RideRequests.Find(rideRequest.Id);
            if (oldRideRequest != null)
            {
                oldRideRequest.FamilyId = rideRequest.FamilyId;

                oldRideRequest.VolunteerId = rideRequest.VolunteerId;

                oldRideRequest.RideTime = rideRequest.RideTime;

                oldRideRequest.Status = rideRequest.Status;

                oldRideRequest.RegularRide = rideRequest.RegularRide;

                oldRideRequest.Origin = rideRequest.Origin;

                oldRideRequest.Destination = rideRequest.Destination;

                oldRideRequest.FrequencyRegularRideId = rideRequest.FrequencyRegularRideId;

                oldRideRequest.Family = rideRequest.Family;

                oldRideRequest.FrequencyRegularRide = rideRequest.FrequencyRegularRide;

                oldRideRequest.Volunteer = rideRequest.Volunteer;
    }
            db.SaveChanges();
            return true;
        }

        public bool delete(int id)
        {
            var rideRequest = db.RideRequests.Find(id);
            if (rideRequest == null)
            {
                throw new ArgumentException("rideRequest does not exist");
            }
            db.RideRequests.Remove(rideRequest);
            db.SaveChanges();
            return true;
        }
    }
}