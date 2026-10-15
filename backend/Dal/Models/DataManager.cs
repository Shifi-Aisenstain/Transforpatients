using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Dal.Models;

public partial class DataManager : DbContext
{
    public DataManager()
    {
    }

    public DataManager(DbContextOptions<DataManager> options)
        : base(options)
    {
    }

    public virtual DbSet<Address> Addresses { get; set; }

    public virtual DbSet<Family> Families { get; set; }

    public virtual DbSet<RideFrequency> RideFrequencies { get; set; }

    public virtual DbSet<RideRequest> RideRequests { get; set; }
    public virtual DbSet<Volunteer> Volunteers { get; set; }

    public virtual DbSet<VolunteersFreeTime> VolunteersFreeTimes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Addresse__3214EC07C474918C");

            entity.Property(e => e.City)
                .HasMaxLength(50)
                .IsUnicode(true);
            entity.Property(e => e.Neighborhood)
                .HasMaxLength(50)
                .IsUnicode(true);
            entity.Property(e => e.Street)
                .HasMaxLength(50)
                .IsUnicode(true);
        });

        modelBuilder.Entity<Family>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__tmp_ms_x__3214EC077FC55014");

            entity.Property(e => e.Email)
                .HasMaxLength(50)
                .IsUnicode(true);
            entity.Property(e => e.LastName)
                .HasMaxLength(50)
                .IsUnicode(true);
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(50)
                .IsUnicode(true);

            entity.HasOne(d => d.Address).WithMany(p => p.Families)
                .HasForeignKey(d => d.AddressId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Families_Addresses");
        });

        modelBuilder.Entity<RideFrequency>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__RideFreq__3214EC0792F301B9");

            entity.ToTable("RideFrequency");
        });

        modelBuilder.Entity<RideRequest>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__tmp_ms_x__3214EC07E1C4B067");

            entity.Property(e => e.RideTime).HasColumnType("datetime");
            entity.Property(e => e.Origin).HasMaxLength(200).IsUnicode(true);
            entity.Property(e => e.Destination).HasMaxLength(200).IsUnicode(true);

            entity.HasOne(d => d.Family).WithMany(p => p.RideRequests)
                .HasForeignKey(d => d.FamilyId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RideRequests_Families");

            entity.HasOne(d => d.FrequencyRegularRide).WithMany(p => p.RideRequests)
                .HasForeignKey(d => d.FrequencyRegularRideId)
                .HasConstraintName("FK_RideRequests_RideFrequency");

            entity.HasOne(d => d.Volunteer).WithMany(p => p.RideRequests)
                .HasForeignKey(d => d.VolunteerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RideRequests_Volunteers");
        });

        modelBuilder.Entity<Volunteer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__tmp_ms_x__3214EC07E1E3FB2D");

            entity.Property(e => e.AvailableSeats)
                .HasMaxLength(10)
                .IsFixedLength();
            entity.Property(e => e.Email)
                .HasMaxLength(50)
                .IsUnicode(true);
            entity.Property(e => e.FirstName)
                .HasMaxLength(50)
                .IsUnicode(true);
            entity.Property(e => e.IsActive).HasColumnName(" IsActive ");
            entity.Property(e => e.LastName)
                .HasMaxLength(50)
                .IsUnicode(true);
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(50)
                .IsUnicode(true);

            entity.HasOne(d => d.Address).WithMany(p => p.Volunteers)
                .HasForeignKey(d => d.AddressId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Volunteers_Addresses");
        });

        modelBuilder.Entity<VolunteersFreeTime>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Voluntee__3214EC07C50AA870");

            entity.Property(e => e.EndDateTime).HasColumnType("datetime");
            entity.Property(e => e.Destination).HasMaxLength(200).IsUnicode(true);
            entity.Property(e => e.StartDateTime).HasColumnType("datetime");

            entity.HasOne(d => d.Volunteer).WithMany(p => p.VolunteersFreeTimes)
                .HasForeignKey(d => d.VolunteerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VolunteersFreeTimes_Volunteers");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
