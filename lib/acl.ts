export type ACL = Record<string, string[]>

const ACL_STORAGE_KEY = "admin_acl_v1"

export function getACL(): ACL {
  if (typeof window === "undefined") return {}

  try {
    const stored = localStorage.getItem(ACL_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function setACL(acl: ACL): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(ACL_STORAGE_KEY, JSON.stringify(acl))
  } catch (error) {
    console.error("Failed to save ACL to localStorage:", error)
  }
}

export function grant(userId: string, projectId: string): ACL {
  const acl = getACL()
  if (!acl[userId]) {
    acl[userId] = []
  }
  if (!acl[userId].includes(projectId)) {
    acl[userId].push(projectId)
  }
  setACL(acl)
  return acl
}

export function revoke(userId: string, projectId: string): ACL {
  const acl = getACL()
  if (acl[userId]) {
    acl[userId] = acl[userId].filter((id) => id !== projectId)
    if (acl[userId].length === 0) {
      delete acl[userId]
    }
  }
  setACL(acl)
  return acl
}

export function setAll(userId: string, projectIds: string[]): ACL {
  const acl = getACL()
  if (projectIds.length === 0) {
    delete acl[userId]
  } else {
    acl[userId] = [...projectIds]
  }
  setACL(acl)
  return acl
}

export function clearAll(userId: string): ACL {
  const acl = getACL()
  delete acl[userId]
  setACL(acl)
  return acl
}

export function resetACL(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(ACL_STORAGE_KEY)
  } catch (error) {
    console.error("Failed to reset ACL:", error)
  }
}

export function exportACL(): void {
  const acl = getACL()
  const blob = new Blob([JSON.stringify(acl, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "acl.json"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importACL(file: File): Promise<ACL> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedACL = JSON.parse(content)

        // Basic validation
        if (typeof importedACL !== "object" || importedACL === null) {
          throw new Error("Invalid ACL format")
        }

        // Validate structure
        for (const [userId, projectIds] of Object.entries(importedACL)) {
          if (!Array.isArray(projectIds) || !projectIds.every((id) => typeof id === "string")) {
            throw new Error(`Invalid project IDs for user ${userId}`)
          }
        }

        setACL(importedACL)
        resolve(importedACL)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}
