import React from 'react';
import Head from 'next/head';
import SubscriptionContent from '@/components/SubscriptionContent';

export default function SubscriptionsPage() {
  return (
    <>
      <Head>
        <title>Premium Plans - YouTube Clone</title>
      </Head>
      <SubscriptionContent />
    </>
  );
}