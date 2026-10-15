using System;
using System.Collections.Generic;

namespace Dal.Models;

public partial class RideFrequency
{
    public int Id { get; set; }

    public int Frequency { get; set; }

    public virtual ICollection<RideRequest> RideRequests { get; set; } = new List<RideRequest>();
}
