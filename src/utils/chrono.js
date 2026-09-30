
module.exports = {
  /**
   * Get current timestamp in the unit of seconds.
   * @param {Date} date 
   * @returns 
   */
  getTimeSecond: function (date) {
    var result;

    if (!date)
      date = new Date();

    result = date.getTime();
    result /= 1000;
    result -= result % 1;

    return result;
  },
  /**
   * Convert minute to second.
   * @param {number|string} m - Minutes.
   * @returns 
   */
  getSecondFromMinute(m) {
    return Math.imul(Number(m), 60);
  }
};
