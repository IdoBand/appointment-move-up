import { AppointmentManager } from './AppointmentManager';
import { Appointment } from './types';
import { format } from 'date-fns'

jest.mock('./TimeConstraints', () => ({
  timeConstraints: {
    general: {
      disallowedDays: ['יום א'],
      disallowedDates: ['10/04/2025'],
      disallowedTimeFrame: ['08:00-10:00']
    },
    specific: [
      {
        disallowedDate: '11/04/2025',
        disallowedTimeFrame: '14:00-15:00' 
      }
    ],
    noLaterThan: '15/05/2025',
    isTodayAllowed: false
  }
}));


describe('AppointmentManager.isAppointmentSatisfiesConstraints', () => {
  let manager: AppointmentManager

  beforeEach(() => {
    manager = new AppointmentManager();
  });

  it('should return false, appointment date is disallowed (general)', () => {
    const result = manager.isAppointmentSatisfiesConstraints({
      date: '10/04/2025',
      hebrewDay: 'יום ג',
      hour: '14:30',
      buttonId: 'btn1'
    });
    expect(result).toBe(false);
  });
  it('should return false, appointment hebrewDay is disallowed (general)', () => {
    const result = manager.isAppointmentSatisfiesConstraints({
      date: '14/04/2025',
      hebrewDay: 'יום א',
      hour: '14:30',
      buttonId: 'btn1'
    });
    expect(result).toBe(false);
  });
  it('should return false, appointment hour disallowed (general)', () => {
    const result = manager.isAppointmentSatisfiesConstraints({
      date: '14/04/2025',
      hebrewDay: 'יום ב',
      hour: '08:30',
      buttonId: 'btn1'
    });
    expect(result).toBe(false);
  });
  it('should return false, appointment date and hour disallowed (specific)', () => {
    const result = manager.isAppointmentSatisfiesConstraints({
        date: '11/04/2025',
        hebrewDay: '',
        hour: '14:33',
        buttonId: 'btn2'
    });
    expect(result).toBe(false);
  });
  it('should return false, appointment date is disallowed (noLaterThan)', () => {
    const result = manager.isAppointmentSatisfiesConstraints({
        date: '20/05/2025',
        hebrewDay: 'יום ד',
        hour: '10:30',
        buttonId: 'btn3'
    });
    expect(result).toBe(false);
  });

  it('should return false, appointment date is disallowed (isTodayAllowed)', () => {
    const result = manager.isAppointmentSatisfiesConstraints({
        date: format(new Date(), 'dd/MM/yyyy'),
        hebrewDay: 'יום ה',
        hour: '12:00',
        buttonId: 'btn4'
    });
    expect(result).toBe(false);
  });
  it('should return true, appointment does not contradict any time constraints', () => {
    const result = manager.isAppointmentSatisfiesConstraints({
        date: '15/05/2025',
        hebrewDay: 'יום ה',
        hour: '12:00',
        buttonId: 'btn4'
    });
    expect(result).toBe(true);
  });
  it('should return true, appointment does not contradict any time constraints', () => {
    const result = manager.isAppointmentSatisfiesConstraints({
        date: '09/05/2025',
        hebrewDay: 'יום ד',
        hour: '13:00',
        buttonId: 'btn4'
    });
    expect(result).toBe(true);
  });
});


describe('AppointmentManager.isHourInRange', () => {
  let manager: AppointmentManager
  let range: string
  beforeEach(() => {
    manager = new AppointmentManager();
    range = '10:00-11:00'
  });

  it('should return true, minimum in range', () => {
    const result = manager.isHourInRange(range, '10:00');
    expect(result).toBe(true);
  });
  it('should return true, maximum in range', () => {
    const result = manager.isHourInRange(range, '11:00');
    expect(result).toBe(true);
  });
  it('should return true, somewhere in range', () => {
    const result = manager.isHourInRange(range, '10:30');
    expect(result).toBe(true);
  });
  it('should return false, before range 1', () => {
    const result = manager.isHourInRange(range, '09:00');
    expect(result).toBe(false);
  });
  it('should return false, before range 2', () => {
    const result = manager.isHourInRange(range, '09:59');
    expect(result).toBe(false);
  });
  it('should return false, after range 1', () => {
    const result = manager.isHourInRange(range, '11:01');
    expect(result).toBe(false);
  });
  it('should return false, after range 2', () => {
    const result = manager.isHourInRange(range, '22:00');
    expect(result).toBe(false);
  });

});