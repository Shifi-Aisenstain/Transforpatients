using System;
using System.Collections.Generic;

namespace Dal.Models;

public partial class RideRequest
{
    public int? Id { get; set; }

    public int FamilyId{ get; set; }

    public int? VolunteerId { get; set; }

    public DateTime RideTime { get; set; }

    public int Status { get; set; }

    public bool RegularRide { get; set; }

    public string? Origin { get; set; }

    public string? Destination { get; set; }

    public int? FrequencyRegularRideId { get; set; }

    public virtual Family? Family { get; set; } = null!;

    public virtual RideFrequency? FrequencyRegularRide { get; set; }

    public virtual Volunteer Volunteer { get; set; } = null!;
}
