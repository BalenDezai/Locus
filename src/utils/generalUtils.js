class GeneralUtils {
  /**
   * checks if the member has the specific neccesary command perms
   * @param {*} memberPermissions the member permissions
   * @param {*} commandPermissions the permissions needed to run command
   */
  static hasPerms(memberPermissions, commandPermissions) {
    commandPermissions.forEach((perm) => {
      if (!memberPermissions.includes(perm)) {
        return false;
      }
    });
    return true;
  }
}

module.exports = GeneralUtils;
