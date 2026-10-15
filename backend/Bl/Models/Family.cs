using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Bl.Models
{
    public class Family
    {
        public int Id { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public int? AddressId { get; set; }
        public int? NumberOfPeople { get; set; }
        public AddressForScreen? address { get; set; }
    }
}

