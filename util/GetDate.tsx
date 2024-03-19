export function GetDate(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth() + 1; // Months start at 0!
    const dd = today.getDate();
    let MM = mm.toString();
    let DD = dd.toString();

    if (dd < 10) {
        DD = '0' + dd;
    }

    if (mm < 10) {
        MM = '0' + mm;
    }

    // Return date in YYYYMMDD format for Yext param
    return yyyy + MM + DD;
}