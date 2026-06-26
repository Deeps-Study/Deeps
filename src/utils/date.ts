export function getStudyStatus(
    startDate: string,
    endDate: string,
): 'before' | 'ing' | 'end' {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return 'before';
    if (now > end) return 'end';
    return 'ing';
}
