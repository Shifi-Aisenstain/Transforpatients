using Dal.Api;
using Dal.Models;
using Microsoft.EntityFrameworkCore;

namespace Dal.Services
{
    public class FamiliesService : IFamilies
    {

        DataManager db;

        public FamiliesService(DataManager db)
        {
            this.db = db;
        }

        public bool Create(Family family)
        {
            try
            {
                db.Families.Add(family);
                db.SaveChanges();

                return true;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public List<Family> GetAll()
        {
            return db.Families.Include(f => f.Address).ToList();
        }


        public bool Update(Family family, string oldPhoneNumber)
        {
            if (family == null)
            {
                throw new ArgumentNullException("Family is not exists");
            }
            var familyForUpdate = db.Families.Include(f => f.Address).FirstOrDefault(f => f.PhoneNumber == oldPhoneNumber);
            if (familyForUpdate == null)
            {
                throw new ArgumentException("family does not exist");
            }
            familyForUpdate.PhoneNumber = family.PhoneNumber;
            familyForUpdate.LastName = family.LastName;
            familyForUpdate.Email = family.Email;
            familyForUpdate.NumberOfPeople = family.NumberOfPeople;

            if (family.Address != null)
            {
                if (familyForUpdate.Address == null)
                {
                    familyForUpdate.Address = family.Address;
                }
                else
                {
                    familyForUpdate.Address.City = family.Address.City;
                    familyForUpdate.Address.Neighborhood = family.Address.Neighborhood;
                    familyForUpdate.Address.Street = family.Address.Street;
                    familyForUpdate.Address.HouseNumber = family.Address.HouseNumber;
                }
            }
            db.SaveChanges();
            return true;
        }
    }
}