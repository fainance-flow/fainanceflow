import axios from "@libs/axios";
import type { AxiosResponse } from "axios";
import type { User } from "@utils/types";

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export const login = (payload: LoginPayload): Promise<AxiosResponse<AuthResponse>> =>
  axios.post<AuthResponse>("/auth/login", payload);

export const register = (payload: RegisterPayload): Promise<AxiosResponse<AuthResponse>> =>
  axios.post<AuthResponse>("/auth/register", payload);

export const refresh = (
  refreshToken: string
): Promise<AxiosResponse<{ accessToken: string; refreshToken: string }>> =>
  axios.post("/auth/refresh", { refreshToken });

export const logout = (): Promise<AxiosResponse<{ ok: true }>> => axios.post("/auth/logout");

export const me = (): Promise<AxiosResponse<{ user: User }>> =>
  axios.get<{ user: User }>("/auth/me");

export type ForgotPasswordResponse = {
  message: string;
  resetToken?: string;
};

export const forgotPassword = (email: string): Promise<AxiosResponse<ForgotPasswordResponse>> =>
  axios.post("/auth/forgot-password", { email });

export const resetPassword = (payload: {
  token: string;
  newPassword: string;
}): Promise<AxiosResponse<{ message: string }>> => axios.post("/auth/reset-password", payload);
