// Approximate coordinates of representative/main campuses (NOT student locations).
// Multi-campus institutions require campus selection for exact distances.
// Verify and expand this list before nationwide rollout.
export const CAMPUS_COORDINATES = {
  chula:[13.738,100.530], tu:[14.069,100.600], ku:[13.847,100.569],
  kmutt:[13.651,100.495], kmitl:[13.727,100.778], kmutnb:[13.819,100.513],
  mu:[13.793,100.322], su:[13.819,100.042], bu:[14.040,100.616],
  spu:[13.854,100.586], rangsit:[13.964,100.586], utcc:[13.779,100.560],
  abac:[13.612,100.836], tni:[13.733,100.624], dpu:[13.871,100.550],
  ru:[13.756,100.616], nida:[13.769,100.653], siam:[13.720,100.455],
  ssru:[13.777,100.508], suansunandha:[13.777,100.508],
  rmutk:[13.721,100.530], rmutp:[13.758,100.517], rmutt:[14.037,100.727],
  vru:[14.130,100.616], pim:[13.899,100.535], 'north-bkk':[13.884,100.586],
  cmu:[18.796,98.953], cmru:[18.806,98.985], mju:[18.898,99.013], payap:[18.787,99.035],
  kku:[16.475,102.824], nu:[16.747,100.193], buu:[13.285,100.925],
  sut:[14.872,102.023], nrru:[14.984,102.113], ubu:[15.119,104.900],
  psu:[7.008,100.498], hu:[6.997,100.471], mfu:[20.045,99.894],
  'mae-fah-luang':[20.045,99.894], crru:[19.982,99.851],
  udru:[17.408,102.790], pbru:[13.074,99.970], sru:[9.118,99.328],
  nstru:[8.430,99.965], yru:[6.539,101.282],
}
export const hasCampusCoordinates = id => !!CAMPUS_COORDINATES[id]
export function campusDistance(a,b) {
  const x = CAMPUS_COORDINATES[a], y = CAMPUS_COORDINATES[b]
  if (!x || !y) return null
  const rad = Math.PI / 180
  const dLat = (y[0]-x[0])*rad, dLon = (y[1]-x[1])*rad
  const h = Math.sin(dLat/2)**2 + Math.cos(x[0]*rad)*Math.cos(y[0]*rad)*Math.sin(dLon/2)**2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h))
}
