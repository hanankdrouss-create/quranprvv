# Security Spec

## Data Invariants
- A user can only modify their own profile, quran progress, and favorites.
- A user cannot change their own 'role' or 'isBanned' status.
- Admin users can read and modify all basic users but cannot modify other admins. Default to simple admin check: admin can modify other users' roles/isBanned.
- Only signed-in users can access data.

## The Dirty Dozen Payloads
1. Create user with fake `role: "admin"`
2. Update user to set `role: "vip"`
3. Create user for a different `userId`
4. Payload missing `updatedAt` on update
5. Fake `emailVerified` logic (bypassed if just checking auth token)
6. Read PII of another user
7. Update `isBanned: false` when banned
8. Write a 1MB string to `lastReadSurah`
9. Create favorite without `createdAt` timestamp
10. Update someone else's Quran progress
11. Admin trying to update their own role (maybe allowed? better not)
12. Modify a system-only field like `createdAt` on update

## Test Runner
We will use rules to deny all these.
