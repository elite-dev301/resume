export interface Member {
  _id: string;
  name: string;
}

export enum Role {
  Admin = 'Admin',
  Member = 'Member'
}