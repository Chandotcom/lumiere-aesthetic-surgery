import { RequirePermission } from "@/components/admin/require-permission";

export default function Layout({ children }: LayoutProps<"/admin/gallery">) {
  return <RequirePermission permission="gallery">{children}</RequirePermission>;
}
