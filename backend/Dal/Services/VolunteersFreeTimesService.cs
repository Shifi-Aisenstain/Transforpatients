using Dal.Api;
using Dal.Models;
using Microsoft.EntityFrameworkCore;
namespace Dal.Services
{
    public class VolunteersFreeTimesService : IVolunteersFreeTimes
    {

        DataManager db;
        public VolunteersFreeTimesService(DataManager db)
        {
            this.db = db;
        }

        public List<VolunteersFreeTime> GetAll()
        {
            return db.VolunteersFreeTimes.Include(v => v.Volunteer).ToList();

        }
        public bool Create(VolunteersFreeTime vft)
        {
            try
            {
                db.VolunteersFreeTimes.Add(vft);
                db.SaveChanges();

                return true;
            }
            catch { return false; }
        }

        public bool Update(VolunteersFreeTime vft)
        {
            if (vft == null)
            {
                throw new ArgumentNullException("volunteer free time is not exists");
            }
            var vftForUpdate = db.VolunteersFreeTimes.FirstOrDefault(f => f.Id == vft.Id);
            if (vftForUpdate == null)
            {
                throw new ArgumentException("volunteer free time does not exist");
            }
            vftForUpdate.VolunteerId = (int)(vft?.VolunteerId);
            vftForUpdate.Volunteer = vft.Volunteer;
            vftForUpdate.StartDateTime = vft.StartDateTime;
            vftForUpdate.EndDateTime = vft.EndDateTime;
            db.SaveChanges();
            return true;
        }

        public bool Delete(int id)
        {
            var vft = db.VolunteersFreeTimes.FirstOrDefault(f => f.Id == id);
            if (vft == null)
            {
                throw new ArgumentException("volunteer free time does not exist");
            }
            db.VolunteersFreeTimes.Remove(vft);
            db.SaveChanges();
            return true;
        }
    }
}