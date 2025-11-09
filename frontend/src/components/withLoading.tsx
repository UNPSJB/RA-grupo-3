import React, { useState, useEffect, ComponentType } from 'react';
import Spinner from './Spinner';

const withLoading = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const WithLoadingComponent = (props: P) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }, []);

    return loading ? <Spinner /> : <WrappedComponent {...props} />;
  };

  return WithLoadingComponent;
};

export default withLoading;
