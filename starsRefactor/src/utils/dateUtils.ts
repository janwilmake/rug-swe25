export class DateUtils {
  /**
   * Get start and end dates for a given week in YYYY-WXX format
   * @param yearWeek Week in YYYY-WXX format
   * @returns Object with startDate and endDate in YYYY-MM-DD format
   */
  getWeekDates(yearWeek: string): {
    startDate: string;
    endDate: string;
  } {
    // Parse YYYY-WXX format
    const [year, weekStr] = yearWeek.split("-W");
    const week = parseInt(weekStr, 10);

    // Create date for January 1st of the year
    const januaryFirst = new Date(parseInt(year, 10), 0, 1);

    // Get the day of the week for January 1st (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = januaryFirst.getDay();

    // Calculate days to add to get to first week
    const daysToAdd = (week - 1) * 7 - dayOfWeek + 1;

    // Calculate start date
    const startDate = new Date(parseInt(year, 10), 0, 1 + daysToAdd);

    // Calculate end date (6 days after start date)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    };
  }

  /**
   * Format a Date object as YYYY-MM-DD
   * @param date Date object to format
   * @returns Formatted date string
   */
  formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Get the current week number for a given date
   * @param date Date to get week number for (default: current date)
   * @returns Week number (1-53)
   */
  getWeekNumber(date: Date = new Date()): number {
    // Copy date to avoid modifying the original
    const targetDate = new Date(date);
    
    // Get first day of the year
    const yearStart = new Date(date.getFullYear(), 0, 1);
    
    // Calculate days since start of year, adding 1 for current day
    const days = Math.floor((targetDate.getTime() - yearStart.getTime()) / 86400000) + 1;
    
    // Calculate week number, adjusting for day of week
    const weekNumber = Math.ceil((days + yearStart.getDay()) / 7);
    
    return weekNumber;
  }

  /**
   * Get the current week in YYYY-WXX format
   * @returns Current week in YYYY-WXX format
   */
  getCurrentWeek(): string {
    const now = new Date();
    const year = now.getFullYear();
    const weekNumber = this.getWeekNumber(now);
    
    return `${year}-W${weekNumber}`;
  }
  
  /**
   * Get the number of days in a month
   * @param year The year
   * @param month The month (1-12)
   * @returns Number of days in the month
   */
  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }
  
  /**
   * Get the current month in YYYY-MM format
   * @returns Current month in YYYY-MM format
   */
  getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    
    return `${year}-${month}`;
  }
  
  /**
   * Get the previous month in YYYY-MM format
   * @returns Previous month in YYYY-MM format
   */
  getPreviousMonth(): string {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = prevMonth.getFullYear();
    const month = String(prevMonth.getMonth() + 1).padStart(2, "0");
    
    return `${year}-${month}`;
  }
}