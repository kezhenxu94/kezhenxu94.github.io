public class IntegerProducer implements Runnable {
    private int number = 0;

    private final Resources<Integer> resources;

    public IntegerProducer(Resources<Integer> resources) {
        this.resources = resources;
    }

    @SuppressWarnings("InfiniteLoopStatement")
    @Override
    public void run() {
        while (true) {
            try {
                synchronized (resources) {
                    while (!resources.isEmpty()) {
                        resources.wait();
                    }
                    resources.set(number++);
                    resources.notifyAll();
                }
                Thread.sleep(500L);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}

