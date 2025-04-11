import { AppointmentManager } from './AppointmentManager';
import { Appointment } from '../types';
import { format, subDays, addDays } from 'date-fns'

jest.mock('../userData.ts', () => ({
  timeConstraints: {
    general: {
      disallowedDays: ['יום א'],
      disallowedDates: ['10/04/2025'],
      disallowedDatesFrame: ['12/04/2025-14/04/2025'],
      disallowedHoursFrame: ['08:00-10:00']
    },
    specific: [
      {
        disallowedDate: '11/04/2025',
        disallowedHoursFrame: '14:00-15:00' 
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
  it('should return false, appointment hebrewDay is disallowed (general)', () => {
    const result = manager.isAppointmentSatisfiesConstraints({
      date: '14/04/2025',
      hebrewDay: 'יום א',
      hour: '14:30',
      buttonId: 'btn1'
    });
    expect(result).toBe(false);
  });
  it('should return false, appointment date is in disallowedDates (general)', () => {
    const result = manager.isAppointmentSatisfiesConstraints({
      date: '10/04/2025',
      hebrewDay: 'יום ג',
      hour: '14:30',
      buttonId: 'btn1'
    });
    expect(result).toBe(false);
  });
  it('should return false, appointment date is in disallowedDatesFrame - frameStart (general)', () => {
    const result = manager.isAppointmentSatisfiesConstraints({
      date: '12/04/2025',
      hebrewDay: 'יום ג',
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

describe('AppointmentManager.isDateInFrame', () => {
  let manager: AppointmentManager
  let frame: string
  beforeEach(() => {
    manager = new AppointmentManager();
    frame = '15/04/2025-18/04/2025'
  });

  it('should return true, date on frame start', () => {
    const result = manager.isDateInFrame(frame, '15/04/2025');
    expect(result).toBe(true);
  });
  it('should return true, date in frame', () => {
    const result = manager.isDateInFrame(frame, '16/04/2025');
    expect(result).toBe(true);
  });
  it('should return true, date on frame end', () => {
    const result = manager.isDateInFrame(frame, '18/04/2025');
    expect(result).toBe(true);
  });
  it('should return false, date before frame', () => {
    const result = manager.isDateInFrame(frame, '15/03/2025');
    expect(result).toBe(false);
  });
  it('should return false, date after frame', () => {
    const result = manager.isDateInFrame(frame, '15/05/2025');
    expect(result).toBe(false);
  });
  
});

describe('AppointmentManager.isHourInFrame', () => {
  let manager: AppointmentManager
  let frame: string
  beforeEach(() => {
    manager = new AppointmentManager();
    frame = '10:00-11:00'
  });

  it('should return true, minimum in frame', () => {
    const result = manager.isHourInFrame(frame, '10:00');
    expect(result).toBe(true);
  });
  it('should return true, maximum in frame', () => {
    const result = manager.isHourInFrame(frame, '11:00');
    expect(result).toBe(true);
  });
  it('should return true, somewhere in frame', () => {
    const result = manager.isHourInFrame(frame, '10:30');
    expect(result).toBe(true);
  });
  it('should return false, before frame 1', () => {
    const result = manager.isHourInFrame(frame, '09:00');
    expect(result).toBe(false);
  });
  it('should return false, before frame 2', () => {
    const result = manager.isHourInFrame(frame, '09:59');
    expect(result).toBe(false);
  });
  it('should return false, after frame 1', () => {
    const result = manager.isHourInFrame(frame, '11:01');
    expect(result).toBe(false);
  });
  it('should return false, after frame 2', () => {
    const result = manager.isHourInFrame(frame, '22:00');
    expect(result).toBe(false);
  });

});


describe('AppointmentManager.isTodayPassedNoLaterThanDate', () => {
  let todayFormatted: string
  let dayBeforeFormatted: string
  let dayAfterFormatted: string
  let manager: AppointmentManager

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    const today = new Date()
    todayFormatted = format(today, 'dd/MM/yyyy')
    dayBeforeFormatted = format(subDays(today, 1), 'dd/MM/yyyy')
    dayAfterFormatted = format(addDays(today, 1), 'dd/MM/yyyy')
    manager = new AppointmentManager()
  })

  it('should return true when today is after noLaterThan date', () => {
    jest.isolateModules(() => {
      jest.doMock('../userData.ts', () => ({
        timeConstraints: {
          noLaterThan: dayBeforeFormatted
        }
      }))
  console.log(dayBeforeFormatted);
  expect(manager.isTodayPassedNoLaterThanDate()).toBe(true)
  })
})

it('should return false when today is before noLaterThan date', () => {
  jest.isolateModules(() => {
    jest.doMock('../userData.ts', () => ({
      timeConstraints: {
        noLaterThan: dayAfterFormatted
      }
    }))

    console.log(dayAfterFormatted);
    expect(manager.isTodayPassedNoLaterThanDate()).toBe(false)
  })
})

it('should return false when today is equal to noLaterThan date', () => {
  jest.isolateModules(() => {
    jest.doMock('../userData.ts', () => ({
      timeConstraints: {
        noLaterThan: todayFormatted
      }
    }))

    console.log(dayAfterFormatted);
      expect(manager.isTodayPassedNoLaterThanDate()).toBe(false)
    })
  })
})