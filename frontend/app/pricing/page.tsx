import { Footer } from '@/components/Footer'
import LoaderOne from '@/components/Loader-one'
import { LoaderTwo } from '@/components/Loader-two'
import PricingSection from '@/components/PricingSection'
import { HeroSection } from '@/components/Wishlist'
import React from 'react'

type Props = {}

const page = (props: Props) => {
  return (
    <div>
        
            
        <PricingSection></PricingSection>
        <Footer></Footer>
    </div>
  )
}

export default page