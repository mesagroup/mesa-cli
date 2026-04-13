# Docker Installation Analysis for Non-Admin Users

## Problem Statement

Docker Desktop requires administrator privileges to install on Windows and macOS. This creates a blocker for developers on corporate machines who don't have admin access. The IT department has indicated they could potentially add Docker to the corporate software portal, but the CLI has limited ability to automate this.

## Current Situation

### Why Docker Requires Admin

1. **Windows**: Docker Desktop needs to:
   - Install Hyper-V or WSL2 (system-level virtualization)
   - Create virtual network adapters
   - Modify Windows services
   - Install kernel drivers

2. **macOS**: Docker Desktop needs to:
   - Install privileged helper tools
   - Create network interfaces
   - Modify system-level networking

3. **Linux**: Docker daemon typically runs as root and requires:
   - Socket permissions
   - Network bridge configuration
   - cgroup management

## Potential Solutions

### 1. Corporate Software Portal (Recommended)

**Pros:**
- IT-approved and managed
- Consistent across organization
- Proper licensing and updates
- Security compliance

**Cons:**
- CLI cannot automate detection or installation
- Depends on IT implementation timeline
- May require manual approval per user

**CLI Integration Options:**
- Detect if Docker is available in portal (if portal has CLI/API)
- Show link to corporate portal in error message
- Add environment variable `MESA_DOCKER_PORTAL_URL` for custom portal links

```typescript
// Example implementation
const portalUrl = process.env.MESA_DOCKER_PORTAL_URL 
  ?? 'https://portal.company.com/software/docker';

console.log(`  Options:`);
console.log(`    • Request Docker from your IT portal: ${portalUrl}`);
```

### 2. Podman Desktop (User-Level Alternative)

**What is Podman?**
- Open-source container engine compatible with Docker CLI
- Rootless mode available (no admin needed on Linux)
- Windows/Mac versions still require some privileges but may be less restrictive

**Pros:**
- Drop-in replacement for Docker in many cases
- Supports Docker Compose
- May work without admin on some corporate setups

**Cons:**
- Not 100% Docker-compatible (some edge cases)
- Less familiar to developers
- Windows/Mac versions still need elevated privileges for networking

**CLI Integration:**
```typescript
// Detect Podman as Docker alternative
if (!dockerInstalled && podmanInstalled) {
  console.log('  ✓ Podman detected (Docker-compatible alternative)');
  // Optionally create docker alias to podman
}
```

### 3. Docker Desktop via Winget (User Scope)

**Investigation Needed:**
```powershell
# Test if this works without admin
winget install --id Docker.DockerDesktop --scope user
```

**Expected Result:** Likely fails because Docker Desktop fundamentally needs system-level access for virtualization.

### 4. Remote Docker (Cloud-Based)

**Options:**
- Docker Desktop with remote daemon
- Cloud-based development environments (GitHub Codespaces, GitPod)
- Corporate dev containers

**Pros:**
- No local admin needed
- Consistent environments
- IT can manage centrally

**Cons:**
- Requires network connectivity
- Latency for local development
- Additional infrastructure costs
- Not suitable for all workflows

**CLI Integration:**
```typescript
// Support DOCKER_HOST environment variable
if (process.env.DOCKER_HOST) {
  console.log(`  ℹ Using remote Docker: ${process.env.DOCKER_HOST}`);
}
```

### 5. WSL2 + Docker Engine (Linux)

**Windows-Specific Option:**
- Install WSL2 (may require admin once)
- Install Docker Engine inside WSL2 (no admin in WSL)
- Use Docker from Windows via WSL2

**Pros:**
- More lightweight than Docker Desktop
- Once WSL2 is installed, Docker is user-level
- Better performance in some cases

**Cons:**
- Initial WSL2 setup needs admin
- More complex setup
- Requires Windows 10/11 Pro

### 6. Skip Docker (Optional Dependency)

**Make Docker optional for certain project types:**
- SaaS projects (Azure Functions) don't strictly need Docker locally
- Development can use cloud resources
- CI/CD handles containerization

**CLI Changes:**
```typescript
// Mark Docker as optional for certain project types
if (projectType === 'saas') {
  TOOLS.find(t => t.name === 'docker').required = false;
}
```

## Recommended Approach

### Short Term (Immediate)
1. ✅ **Detect admin status** (already implemented in PR #7)
2. ✅ **Show clear messaging** for Docker requirements (already implemented)
3. **Add environment variable support** for custom portal URLs:
   ```typescript
   MESA_DOCKER_PORTAL_URL=https://your-company.com/software
   ```
4. **Detect Podman as alternative**:
   ```typescript
   if (podmanInstalled) {
     console.log('  ℹ Podman detected - Docker-compatible alternative');
   }
   ```

### Medium Term (Next Sprint)
1. **Corporate portal integration**:
   - Add configuration for corporate software portal URL
   - Detect if Docker is available in portal (if API exists)
   - Provide direct links in error messages

2. **Remote Docker support**:
   - Document `DOCKER_HOST` usage
   - Detect and validate remote Docker connections
   - Add `mesa setup --remote-docker` flag

3. **Project type optimization**:
   - Make Docker optional for SaaS projects
   - Provide cloud-based alternatives in documentation

### Long Term (Future)
1. **Podman full support**:
   - Test compatibility with Aspire
   - Document Podman setup
   - Auto-detect and configure Podman

2. **Cloud dev environments**:
   - GitHub Codespaces configuration
   - DevContainer support
   - Remote development workflows

## Implementation Priority

| Solution | Effort | Impact | Priority |
|----------|--------|--------|----------|
| Custom portal URL env var | Low | Medium | High |
| Podman detection | Low | Medium | High |
| Remote Docker docs | Low | Low | Medium |
| Make Docker optional (SaaS) | Medium | Medium | Medium |
| Podman auto-install | Medium | Low | Low |
| Cloud dev environments | High | High | Low |

## Questions for IT

1. **Portal Integration:**
   - Does the corporate portal have an API or CLI?
   - Can we detect if a user has Docker access programmatically?
   - What's the approval process for Docker requests?

2. **Alternatives:**
   - Is Podman Desktop approved for use?
   - Are remote Docker instances available?
   - Can WSL2 be pre-installed on developer machines?

3. **Permissions:**
   - Can Docker Desktop be pre-approved for specific teams?
   - Is there a self-service option for developers?
   - What's the typical turnaround time for Docker access requests?

## Conclusion

The CLI has done what it can to support non-admin users for other tools. For Docker specifically:

1. **Best immediate action**: Add support for custom portal URLs via environment variable
2. **Best medium-term action**: Work with IT to integrate with corporate software portal
3. **Best alternative**: Support and document Podman as a Docker alternative

The fundamental limitation is that Docker Desktop requires system-level privileges by design. The CLI can guide users, detect alternatives, and integrate with corporate processes, but cannot bypass the underlying OS security requirements.
