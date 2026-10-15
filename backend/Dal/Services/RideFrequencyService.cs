using Dal.Api;
using Dal.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dal.Services
{

    public class RideFrequencyService : IRideFrequency
    {
        DataManager db;
        public RideFrequencyService(DataManager db)
        {
            this.db = db;
        }

        public List<RideFrequency> GetAll()
        {
            return db.RideFrequencies.ToList();

        }





            public bool Create(RideFrequency rideFrequency)
            {
                if (rideFrequency == null)
                {
                    throw new ArgumentNullException();
                }
                db.RideFrequencies.Add(rideFrequency);
                db.SaveChanges();
                return true;
            }

        public bool Update(RideFrequency entity)
        {
            throw new NotImplementedException();
        }

        //public bool Update(RideRequest rideRequest)
        //{
        //    if (rideRequest == null)
        //    {
        //        throw new ArgumentNullException();
        //    }

        //    if (db.RideRequests.Find(rideRequest.Id) == null)
        //    {
        //        throw new ArgumentException("rideRequest does not exist");
        //    }

        //    var oldRideRequest = db.RideRequests.Find(rideRequest.Id);
        //    if (oldRideRequest != null)
        //    {
        //        oldRideRequest.FamilyId = rideRequest.FamilyId;

        //        oldRideRequest.VolunteerId = rideRequest.VolunteerId;

        //        oldRideRequest.RideTime = rideRequest.RideTime;

        //        oldRideRequest.Status = rideRequest.Status;

        //        oldRideRequest.RegularRide = rideRequest.RegularRide;

        //        oldRideRequest.FrequencyRegularRideId = rideRequest.FrequencyRegularRideId;

        //        oldRideRequest.Family = rideRequest.Family;

        //        oldRideRequest.FrequencyRegularRide = rideRequest.FrequencyRegularRide;

        //        oldRideRequest.Volunteer = rideRequest.Volunteer;
        //    }
        //    db.SaveChanges();
        //    return true;
        //}
    }
    }