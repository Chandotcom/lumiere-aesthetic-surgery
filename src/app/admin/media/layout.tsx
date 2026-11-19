import { RequirePermission } from "@/components/admin/require-permission";

export default function Layout({ children }: LayoutProps<"/admin/media">) {
  return <RequirePermission permission="media">{children}</RequirePermission>;
}
