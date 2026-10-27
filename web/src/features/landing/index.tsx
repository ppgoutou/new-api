/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { ModelPricing, VideoCta, VideoHero } from '@/features/home/components'
import { HomePlaybackProvider } from '@/features/home/components/home-playback'
import { useAuthStore } from '@/stores/auth-store'

import { ContactSection } from './components/contact-section'
import { ProductHighlights } from './components/product-highlights'
import { RelayGuide } from './components/relay-guide'

/**
 * Standalone Seedance product landing page for campaign links: product
 * introduction, pricing, how to get into the relay station, and contacts.
 */
export function Landing() {
  const isAuthenticated = useAuthStore((state) => !!state.auth.user)

  return (
    <PublicLayout showMainContainer={false}>
      <HomePlaybackProvider>
        <VideoHero isAuthenticated={isAuthenticated} />
      </HomePlaybackProvider>
      <ProductHighlights />
      <ModelPricing />
      <RelayGuide isAuthenticated={isAuthenticated} />
      <ContactSection />
      <VideoCta isAuthenticated={isAuthenticated} />
      <Footer />
    </PublicLayout>
  )
}
