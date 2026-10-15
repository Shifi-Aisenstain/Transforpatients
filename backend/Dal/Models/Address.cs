using System;
using System.Collections.Generic;

namespace Dal.Models;

public partial class Address
{
    public int Id { get; set; }

    public string City { get; set; } = null!;

    public string Neighborhood { get; set; } = null!;

    public string Street { get; set; } = null!;

    public int HouseNumber { get; set; }

    public virtual ICollection<Family> Families { get; set; } = new List<Family>();

    public virtual ICollection<Volunteer> Volunteers { get; set; } = new List<Volunteer>();
}
