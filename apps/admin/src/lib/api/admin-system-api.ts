import { apiClient } from "./api-client";
import { StoreSettings } from "@veyora/types";
import { UpdateSettingsInput } from "@veyora/validators";

export const adminSystemApi = {
  getSettings: () => apiClient.get<StoreSettings>("/admin/settings"),

  updateSettings: (data: UpdateSettingsInput) =>
    apiClient.put<StoreSettings>("/admin/settings", data),
};
