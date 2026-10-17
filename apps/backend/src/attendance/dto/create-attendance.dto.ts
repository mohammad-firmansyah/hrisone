/** Payloads sent by the gateway over TCP. The gateway has already authenticated the user. */

export class PhotoPayload {
  base64: string;
  ext: string;
}

export class ClockInPayload {
  userId: number;
  latitude: number;
  longitude: number;
  notes: string;
  photo: PhotoPayload;
}

export class ClockOutPayload {
  userId: number;
  latitude: number;
  longitude: number;
  photo: PhotoPayload;
}

export class ListAllPayload {
  requesterId: number;
  page?: number;
  pageSize?: number;
  search?: string;
  date?: string;
}


export class PhotoRequestPayload {
  requesterId: number;
  id: number;
  kind: 'in' | 'out';
}

export class CreateAttendanceDto {}
