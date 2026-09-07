export type ProfileActionState = {
  ok: boolean;
  message: string | null;
};

export const PROFILE_INITIAL_STATE: ProfileActionState = {
  ok: false,
  message: null,
};
