import { RequirePermission } from "@/components/admin/require-permission";

export default function Layout({ children }: LayoutProps<"/admin/leads">) {
  return <RequirePermission permission="leads">{children}</RequirePermission>;
}
