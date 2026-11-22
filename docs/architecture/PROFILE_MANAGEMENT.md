# Veyora — Complete Profile Management System Architecture

## Customer Storefront (Web) + Admin Portal + Backend API + Cloudinary CDN Integration

---

## 1. System Overview

The Veyora Profile Management System delivers a secure, production-grade user management and avatar storage infrastructure across both the customer-facing e-commerce storefront (`apps/web`) and the administrative portal (`apps/admin`).

The architecture strictly decouples:

- **Authentication & Security Credentials**: Passwords, refresh tokens, active session IDs, and authorization flags remain strictly managed by `authRouter` and cryptographic token rotators.
- **Profile & Personal Details**: First name, last name, display title, phone number, bio, gender, date of birth, and regional preferences are editable via self-service APIs with strict field allowlisting.
- **Cloudinary Asset Storage**: High-resolution avatar assets are uploaded directly from clients to Cloudinary CDN using server-signed upload parameters, eliminating backend bandwidth bottlenecks while enforcing folder isolation and MIME/size bounds.
- **Profile Completion Engine**: A shared deterministic utility computes completion percentages and itemized checklists based on meaningful required fields.

---

## 2. Profile Data Model & User Schema Extension

The existing Mongoose `User` model (`apps/api/src/modules/auth/models/user.model.ts`) was extended cleanly to avoid duplicate user collections:

```typescript
export interface IUserAvatar {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface IUserPreferences {
  language?: string;
  timezone?: string;
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  avatar?: IUserAvatar | null;
  bio?: string | null;
  dateOfBirth?: Date | null;
  gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
  preferences?: IUserPreferences;
  phone?: string | null;
  role: UserRole;
  permissions: UserPermission[];
  assignedRoles?: mongoose.Types.ObjectId[];
  customPermissions?: string[];
  isEmailVerified: boolean;
  isActive: boolean;
  statusReason?: string | null;
  notes?: string | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Cloudinary Integration Architecture

### 3.1 Security Principles

- **Zero API Secret Leakage**: `CLOUDINARY_API_SECRET` is never sent to frontend bundles or client browsers.
- **Signed Uploads**: Upload parameters (folder path, timestamp, tags, public ID) are cryptographically signed on the server via `cloudinary.utils.api_sign_request()`.
- **Folder Isolation**:
  - Customers: `veyora/profiles/customers/<userId>/`
  - Staff: `veyora/profiles/staff/<userId>/`
- **Asset Metadata Validation**: When the client submits an avatar reference back to `PATCH /api/v1/profile/avatar`, the server verifies:
  1. `publicId` strictly matches the authenticated user's folder boundary.
  2. `secureUrl` originates from `https://res.cloudinary.com/`.
  3. Format belongs to `["jpg", "jpeg", "png", "webp"]`.
  4. File size is within the 5MB bound.

### 3.2 Sequence Diagram: Signed Avatar Upload

```text
User Browser / Admin UI            Veyora API (/api/v1/profile)           Cloudinary CDN
       │                                       │                                 │
       │── 1. Select image (<5MB, WebP/JPG) ───│                                 │
       │                                       │                                 │
       │── 2. POST /avatar/upload-signature ──>│                                 │
       │   (Bearer Access Token)               │                                 │
       │                                       │── 3. Validate user & role       │
       │                                       │── 4. Sign parameters with HMAC  │
       │<─ 5. Return signature & folder path ──│                                 │
       │                                       │                                 │
       │── 6. POST https://api.cloudinary.com/v1_1/<cloudName>/image/upload ────>│
       │   (File + Signature + Server Timestamp + Folder)                        │
       │                                                                         │
       │<─ 7. Return asset metadata (public_id, secure_url, dimensions) ────────│
       │                                       │                                 │
       │── 8. PATCH /avatar ──────────────────>│                                 │
       │   (publicId, secureUrl, dimensions)   │                                 │
       │                                       │── 9. Verify folder ownership    │
       │                                       │── 10. Update MongoDB User       │
       │                                       │── 11. Async delete old asset ──>│
       │<─ 12. Return updated UserProfileDto ──│                                 │
       │                                       │                                 │
       │── 13. Update TanStack Query Cache ────│                                 │
```

---

## 4. API Endpoints Reference

All endpoints are mounted under `/api/v1` and require `Authorization: Bearer <accessToken>`.

| Method   | Endpoint                                  | Description                                  | Request Body         | Response Contract               |
| -------- | ----------------------------------------- | -------------------------------------------- | -------------------- | ------------------------------- |
| `GET`    | `/api/v1/profile`                         | Retrieve authenticated user's profile        | None                 | `UserProfileDto`                |
| `PATCH`  | `/api/v1/profile`                         | Update personal details (strict allowlist)   | `UpdateProfileInput` | `UserProfileDto`                |
| `POST`   | `/api/v1/profile/avatar/upload-signature` | Generate signed Cloudinary upload params     | None                 | `AvatarUploadSignatureResponse` |
| `PATCH`  | `/api/v1/profile/avatar`                  | Attach verified Cloudinary avatar asset      | `UpdateAvatarInput`  | `UserProfileDto`                |
| `DELETE` | `/api/v1/profile/avatar`                  | Remove avatar and trigger safe asset cleanup | None                 | `UserProfileDto`                |
| `GET`    | `/api/v1/profile/completion`              | Get itemized profile completion metrics      | None                 | `ProfileCompletionDto`          |

---

## 5. Profile Completion Algorithm

Deterministic completion calculations are implemented in `@veyora/utils`:

| Criterion        | Key                | Condition                             | Weight   |
| ---------------- | ------------------ | ------------------------------------- | -------- |
| Full Name        | `name`             | `firstName.trim() && lastName.trim()` | 25%      |
| Verified Email   | `email`            | `email.trim() && isEmailVerified`     | 25%      |
| Phone Number     | `phone`            | `phone.trim().length >= 7`            | 20%      |
| Profile Photo    | `avatar`           | `avatar.secureUrl.length > 0`         | 15%      |
| Personal Details | `personal_details` | `bio                                  |          | displayName |     | gender |     | dateOfBirth` | 15% |
| **Total**        |                    |                                       | **100%** |

---

## 6. Frontend Implementations

### 6.1 Customer Storefront (`apps/web`)

- **Routes**: `/profile` and `/account/profile`
- **Components**:
  - `ProfileAvatar`: Displays high-resolution face-aware avatar via Next.js `Image`, upload triggers, camera icon, loading state with `LoaderCircle`.
  - `ProfileForm`: React Hook Form with `zodResolver(updateProfileSchema)`, dirty-state tracking, disabled save when unchanged.
  - `ProfileCompletionCard`: Visual progress bar and interactive checklist.
  - `AccountInfoCard`: Active account badge, verified email indicator, patron since date.

### 6.2 Admin Console (`apps/admin`)

- **Route**: `/profile`
- **Components**:
  - Staff header with avatar upload and removal.
  - Editable personal details form.
  - Read-only Governance card displaying staff role (`admin` / `superadmin`), account enrollment date, and RBAC policy notice.
  - Profile completion metrics.
