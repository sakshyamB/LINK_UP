import { useEffect, useState } from "react";
import axios from "axios";
import { FaMoon, FaSave, FaSun } from "react-icons/fa";
import Leftbar from "../components/Leftbar";
import Logoutpopup from "../components/Logoutpopup";
import Navbar from "../components/Navbar";
import Rightbar from "../components/Rightbar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const getAuthConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
});

const toDateInput = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

const Settings = () => {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem("theme") === "dark" ? "dark" : "light",
  );
  const [profile, setProfile] = useState({
    username: "",
    profilePicture: "",
    coverPicture: "",
    dateofBirth: "",
    gender: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLogoutPopupOpen, setLogoutPopup] = useState(false);

  useEffect(() => {
    let active = true;
    axios
      .get(`${API_URL}/profile/me`, getAuthConfig())
      .then((response) => {
        if (!active) return;
        const user = response.data.ProfileInfo;
        if (!user) throw new Error("Profile not found.");
        setProfile({
          username: user.username || "",
          profilePicture: user.profilePicture || "",
          coverPicture: user.coverPicture || "",
          dateofBirth: toDateInput(user.dateofBirth),
          gender: user.gender || "",
        });
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Unable to load your profile.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateTheme = (nextTheme) => {
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    setTheme(nextTheme);
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const uploadPicture = async (event, field) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be 8 MB or smaller.");
      return;
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      setError("Cloudinary configuration is missing.");
      return;
    }

    setUploadingPicture(field);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData,
      );
      if (!response.data.secure_url)
        throw new Error("Cloudinary did not return an image URL.");
      setProfile((current) => ({
        ...current,
        [field]: response.data.secure_url,
      }));
      setSuccess(
        field === "profilePicture"
          ? "Profile picture uploaded. Save changes to apply it."
          : "Cover picture uploaded. Save changes to apply it.",
      );
    } catch (uploadError) {
      setError(
        uploadError.response?.data?.error?.message ||
          uploadError.message ||
          "Image upload failed.",
      );
    } finally {
      setUploadingPicture("");
    }
  };

  const clearPicture = (field) => {
    setProfile((current) => ({ ...current, [field]: "" }));
    setSuccess("Picture removed from the form. Save changes to apply it.");
    setError("");
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.patch(
        `${API_URL}/profile/update`,
        {
          username: profile.username.trim(),
          profilePicture: profile.profilePicture.trim() || null,
          coverPicture: profile.coverPicture.trim() || null,
          dateofBirth: new Date(profile.dateofBirth).toISOString(),
          gender: profile.gender,
        },
        getAuthConfig(),
      );
      const updatedProfile = response.data.UpdatedProfile;
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...storedUser, ...updatedProfile }),
      );
      setSuccess("Profile updated.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-700";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl items-start">
        <div className="hidden w-64 shrink-0 md:block">
          <Leftbar setlogoutpopup={setLogoutPopup} />
        </div>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <header className="mb-6 border-b border-slate-200 pb-4">
              <p className="text-xs font-semibold uppercase text-emerald-700">
                Your account
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Settings
              </h1>
            </header>

            <section
              className="mb-7 border-b border-slate-200 pb-7"
              aria-labelledby="appearance-heading"
            >
              <div className="mb-4">
                <h2
                  id="appearance-heading"
                  className="text-base font-bold text-slate-900"
                >
                  Appearance
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose how LinkUp looks on this device.
                </p>
              </div>
              <div
                className="inline-flex rounded-md border border-slate-300 bg-white p-1"
                role="group"
                aria-label="Color theme"
              >
                <button
                  type="button"
                  onClick={() => updateTheme("light")}
                  aria-pressed={theme === "light"}
                  className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold ${theme === "light" ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <FaSun aria-hidden="true" />
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => updateTheme("dark")}
                  aria-pressed={theme === "dark"}
                  className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold ${theme === "dark" ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <FaMoon aria-hidden="true" />
                  Dark
                </button>
              </div>
            </section>

            <section aria-labelledby="profile-settings-heading">
              <div className="mb-4">
                <h2
                  id="profile-settings-heading"
                  className="text-base font-bold text-slate-900"
                >
                  Profile information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the information shown on your profile.
                </p>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  {error}
                </p>
              )}
              {success && (
                <p
                  role="status"
                  className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                >
                  {success}
                </p>
              )}
              {loading ? (
                <p className="py-6 text-sm text-slate-500">
                  Loading profile...
                </p>
              ) : (
                <form
                  onSubmit={saveProfile}
                  className="space-y-4 border-y border-slate-200 py-5"
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Name
                    <input
                      name="username"
                      value={profile.username}
                      onChange={updateField}
                      className={fieldClass}
                      autoComplete="name"
                      required
                      maxLength={40}
                    />
                  </label>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Profile picture
                      </p>
                      {profile.profilePicture ? (
                        <img
                          src={profile.profilePicture}
                          alt="Profile picture preview"
                          className="mt-2 h-24 w-24 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="mt-2 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
                          No photo
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          {uploadingPicture === "profilePicture"
                            ? "Uploading..."
                            : "Choose image"}
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) =>
                              uploadPicture(event, "profilePicture")
                            }
                            disabled={Boolean(uploadingPicture) || saving}
                          />
                        </label>
                        {profile.profilePicture && (
                          <button
                            type="button"
                            onClick={() => clearPicture("profilePicture")}
                            disabled={Boolean(uploadingPicture) || saving}
                            className="rounded-md px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Cover picture
                      </p>
                      {profile.coverPicture ? (
                        <img
                          src={profile.coverPicture}
                          alt="Cover picture preview"
                          className="mt-2 h-24 w-full rounded-md border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="mt-2 flex h-24 w-full items-center justify-center rounded-md bg-slate-100 text-xs text-slate-500">
                          No cover image
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          {uploadingPicture === "coverPicture"
                            ? "Uploading..."
                            : "Choose image"}
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) =>
                              uploadPicture(event, "coverPicture")
                            }
                            disabled={Boolean(uploadingPicture) || saving}
                          />
                        </label>
                        {profile.coverPicture && (
                          <button
                            type="button"
                            onClick={() => clearPicture("coverPicture")}
                            disabled={Boolean(uploadingPicture) || saving}
                            className="rounded-md px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Date of birth
                      <input
                        name="dateofBirth"
                        type="date"
                        value={profile.dateofBirth}
                        onChange={updateField}
                        className={fieldClass}
                        required
                        max={new Date().toISOString().slice(0, 10)}
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      Gender
                      <select
                        name="gender"
                        value={profile.gender}
                        onChange={updateField}
                        className={fieldClass}
                        required
                      >
                        <option value="" disabled>
                          Select gender
                        </option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Others">Others</option>
                      </select>
                    </label>
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving || Boolean(uploadingPicture)}
                      className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
                    >
                      <FaSave aria-hidden="true" />
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </main>
        <div className="hidden w-64 shrink-0 lg:block">
          <Rightbar />
        </div>
      </div>
      {isLogoutPopupOpen && <Logoutpopup setLogoutpopup={setLogoutPopup} />}
    </div>
  );
};

export default Settings;
