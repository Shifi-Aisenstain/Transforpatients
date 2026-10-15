using Dal.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Bl.Models
{
    public class AddressForScreen
    {

        public string City { get; set; } = null!;

        public string Neighborhood { get; set; } = null!;

        public string Street { get; set; } = null!;

        public int HouseNumber { get; set; }

        public virtual ICollection<Family> Families { get; set; } = new List<Family>();

        public virtual ICollection<Volunteer> Volunteers { get; set; } = new List<Volunteer>();
    }
}
