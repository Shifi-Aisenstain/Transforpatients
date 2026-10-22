import { buildExplainRequest, describeMatch, toWhatsAppNumber } from './aiAssistant';
import { VolunteerMatch } from './matching';

const match = (overrides: Partial<VolunteerMatch> & { firstName?: string; seats?: number | null; city?: string }): VolunteerMatch => ({
  volunteer: {
    id: 1,
    firstName: overrides.firstName ?? 'דנה',
    lastName: 'לוי',
    phoneNumber: '0501234567',
    isCarHandicapped: false,
    isBabySeat: false,
    availableSeats: overrides.seats === undefined ? 4 : overrides.seats,
    address: { city: overrides.city ?? 'רמת גן', neighborhood: '', street: '', houseNumber: 1 },
  },
  slot: { id: 1, volunteerId: 1, startDateTime: '2026-10-23T06:00:00', endDateTime: '2026-10-23T13:00:00', destination: 'שיבא' } as any,
  availableAtTime: true,
  directionMatch: true,
  sameCity: true,
  enoughSeats: true,
  busy: false,
  score: 10,
  percent: 100,
  ...overrides,
});

describe('toWhatsAppNumber', () => {
  it('converts an Israeli number to the international form', () => {
    expect(toWhatsAppNumber('050-123-4567')).toBe('972501234567');
    expect(toWhatsAppNumber('0501234567')).toBe('972501234567');
  });

  it('keeps a number that is already international and rejects an empty one', () => {
    expect(toWhatsAppNumber('+972 50 123 4567')).toBe('972501234567');
    expect(toWhatsAppNumber('')).toBeNull();
    expect(toWhatsAppNumber(null)).toBeNull();
  });
});

describe('describeMatch', () => {
  it('lists the reasons in favour of a fully matching volunteer and none against', () => {
    const { pros, cons } = describeMatch(match({}));
    expect(pros).toHaveLength(4);
    expect(pros.join(' ')).toContain('נוסע/ת לכיוון שיבא');
    expect(pros.join(' ')).toContain('גר/ה ברמת גן');
    expect(cons).toHaveLength(0);
  });

  it('lists what speaks against a volunteer who is busy, has too few seats and is not driving that way', () => {
    const { pros, cons } = describeMatch(match({ directionMatch: false, enoughSeats: false, busy: true, sameCity: false, seats: 1 }));
    expect(pros).toHaveLength(1);
    expect(cons.join(' ')).toContain('שאינו תואם ליעד');
    expect(cons.join(' ')).toContain('1 מושבים, לא מספיק');
    expect(cons.join(' ')).toContain('כבר משובץ/ת לנסיעה אחרת');
  });

  it('says when the volunteer has no availability at that time', () => {
    const { cons } = describeMatch(match({ availableAtTime: false, directionMatch: false, slot: undefined }));
    expect(cons).toContain('לא הזין/ה זמינות בשעה זו');
    expect(cons).toContain('כיוון הנסיעה לא ידוע');
  });
});

describe('buildExplainRequest', () => {
  const ride = { rideTime: '2026-10-23T08:00:00', origin: 'רמת גן, ביאליק 12', destination: 'שיבא' };

  it('takes the best volunteers with a positive score, in ranking order, with first names only', () => {
    const matches = [
      match({ firstName: 'דנה', score: 10, percent: 100 }),
      match({ firstName: 'יוסי', score: 4, percent: 40 }),
      match({ firstName: 'רונית', score: 3, percent: 30 }),
      match({ firstName: 'משה', score: 2, percent: 20 }),
      match({ firstName: 'אבי', score: 0, percent: 0 }),
    ];

    const request = buildExplainRequest(ride, 3, matches);

    expect(request.candidates.map(c => c.firstName)).toEqual(['דנה', 'יוסי', 'רונית']);
    expect(request.candidates[0].percent).toBe(100);
    expect(JSON.stringify(request)).not.toContain('0501234567');
    expect(JSON.stringify(request)).not.toContain('לוי');
    expect(request.ride).toEqual({ start: '2026-10-23T08:00:00', origin: 'רמת גן, ביאליק 12', destination: 'שיבא', passengers: 3 });
  });

  it('uses at least one passenger and the last name when a volunteer has no first name', () => {
    const request = buildExplainRequest(ride, undefined, [match({ firstName: '' })]);

    expect(request.ride.passengers).toBe(1);
    expect(request.candidates[0].firstName).toBe('לוי');
  });

  it('has no candidates when nobody has a positive score', () => {
    expect(buildExplainRequest(ride, 2, [match({ score: 0, percent: 0 })]).candidates).toEqual([]);
  });
});
