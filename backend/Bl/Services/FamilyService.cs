using Bl.Api;
using Bl.Models;
using Dal.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Bl.Services
{
    public class FamilyService : IFamily
    {
        FamiliesService db;

        public FamilyService(Dal.Services.FamiliesService db)
        {

            this.db = db;
        }
        public bool Create(FullFamily family)
        {
            if (family == null)
            {
                throw new ArgumentNullException("family is null");
            }
            var dalFamily = new Dal.Models.Family
            {
                Id = family.Id,
                LastName = family.LastName,
                PhoneNumber = family.PhoneNumber,
                Email = family.Email,
                AddressId = family.AddressId,
                NumberOfPeople = family.NumberOfPeople,
                Address = family.Address,
                RideRequests = family.RideRequests
            };
            return db.Create(dalFamily);
        }

        public List<Family> GetAll()
        {
            List<Bl.Models.Family> list = new List<Bl.Models.Family>();
            db.GetAll().ForEach(f => list.Add(new Bl.Models.Family()
            {
                Id = f.Id??0,
                LastName = f.LastName,
                PhoneNumber = f.PhoneNumber,
                Email = f.Email,
                AddressId = f.AddressId,
                NumberOfPeople = f.NumberOfPeople,
                address = f.Address != null ? new Bl.Models.AddressForScreen
                {
                    City = f.Address.City,
                    Neighborhood = f.Address.Neighborhood,
                    Street = f.Address.Street,
                    HouseNumber = f.Address.HouseNumber
                } : null
            }));
            return list;
        }

        public bool Update(FullFamily family ,string oldPhoneNumber)
        {
            var dalFamily = new Dal.Models.Family
            {
                Id = family.Id,
                LastName = family.LastName,
                PhoneNumber = family.PhoneNumber,
                Email = family.Email,
                AddressId = family.AddressId,
                NumberOfPeople = family.NumberOfPeople,
                Address = family.Address,
            };
            return db.Update(dalFamily, oldPhoneNumber);
        }
    }
}






