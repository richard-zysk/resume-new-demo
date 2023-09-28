type RoleType = "system" | "user" | "assistant";
  
interface Message {
    role: RoleType;
    content: string;
}